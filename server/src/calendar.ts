import { Router } from "express";
import crypto from "node:crypto";
import type { Request, Response } from "express";
import { getSessionUser, type AuthUser } from "./auth.js";
import { getHabits, getHabitById } from "./data.js";

/**
 * Google Calendar (мок, только Premium).
 *
 * В проде:
 *  - /api/calendar/connect перенаправляет на Google OAuth 2.0 (consent),
 *    после редиректа обмениваем code на access_token и refresh_token,
 *    refresh_token храним в БД зашифрованным (AES).
 *  - /api/calendar/sync создаёт/обновляет recurring-события через Google
 *    Calendar API на основе расписания привычки.
 *
 * Здесь сервис эмулируется: токены — заглушки, события — в памяти.
 */

interface Token { accessToken: string; refreshToken: string }

interface CalendarEvent {
  singleId: string;
  exid: string;
  habitId: string;
  title: string;
  start: string; // ISO
  until: string;
  frequency: string;
}

/** userId -> токены */
const tokens = new Map<string, Token>();
/** habitId -> синхронизированные события */
const events = new Map<string, CalendarEvent[]>();

const FREQ_LABEL = (f: string): string =>
  f === "every-other" ? "RRULE:FREQ=WEEKLY;INTERVAL=2"
    : f === "3x" ? "RRULE:FREQ=WEEKLY;COUNT=3"
    : f === "5x" ? "RRULE:FREQ=WEEKLY;COUNT=5"
    : "RRULE:FREQ=DAILY";

const requireSession = (req: Request, res: Response): AuthUser | undefined => {
  const user = getSessionUser(req);
  if (!user) res.status(401).json({ error: "Не авторизован" });
  return user;
};

const requirePremium = (user: AuthUser | undefined, res: Response): boolean => {
  if (!user) return false;
  if (user.plan !== "premium") {
    res.status(403).json({ error: "Google Calendar доступен только на тарифе Premium" });
    return false;
  }
  return true;
};

/** «Зашифровать» токены (заглушка — в проде AES-256 со значком из env) */
const encrypt = (s: string) => `enc:${Buffer.from(s).toString("base64")}`;
const decrypt = (s: string) => Buffer.from(s.replace(/^enc:/, ""), "base64").toString();

// ---------- Маршруты ----------

const router = Router();

/** Начать подключение Google Calendar */
router.post("/connect", (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  if (!requirePremium(user, res)) return;
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=GOOGLE_CLIENT_ID&redirect_uri=http://localhost:5173/settings&response_type=code&scope=https://www.googleapis.com/auth/calendar&state=${user.id}`;
  res.json({ auth_url: authUrl, need_authorization: !tokens.has(user.id) });
});

/**
 * Завершить OAuth: обмен code на токены (GET /api/calendar/callback).
 * В проде это endpoint, на который Google редиректит после подтверждения.
 */
router.post("/callback", (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  if (user.plan !== "premium") {
    return void res.status(403).json({ error: "Только для Premium" });
  }
  tokens.set(user.id, {
    accessToken: encrypt(`at_${crypto.randomBytes(8).toString("hex")}`),
    refreshToken: encrypt(`rt_${crypto.randomBytes(8).toString("hex")}`),
  });
  // Синхронизируем уже существующие привычки
  const synced = getHabits().filter((h) => h.reminderTime).map((h) => syncHabitInternal(user, h.id)).filter(Boolean).length;
  res.json({ connected: true, contacts_synced: synced, permissions: "default[calendar]" });
});

/** Статус подключения */
router.get("/status", (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  res.json({ connected: Boolean(tokens.has(user.id)), premium: user.plan === "premium" });
});

/** Отключить Google Calendar */
router.post("/disconnect", (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  tokens.delete(user.id);
  for (const [k, v] of events) {
    if (v.some((e) => e.habitId)) events.delete(k);
  }
  res.json({ connected: false });
});

/** Синхронизировать привычку с календарём (создать/обновить события) */
router.post("/sync", (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  if (!requirePremium(user, res)) return;
  const habitId = req.body?.habit_id ?? req.body?.habitId;

  // Без habit_id или "all" — синхронизируем все привычки с расписанием
  const ids = !habitId || habitId === "all"
    ? getHabits().map((h) => h.id)
    : [String(habitId)];

  const events: CalendarEvent[] = [];
  const missing = ids.filter((id) => !getHabitById(id));
  if (missing.length) {
    return void res.status(404).json({ error: `Привычка не найдена: ${missing[0]}` });
  }
  for (const id of ids) {
    const created = syncHabitInternal(user, id);
    if (created) events.push(...created);
  }
  if (events.length === 0) {
    return void res.status(400).json({ error: "Укажите время напоминания и подключите календарь" });
  }
  res.json({ synced: true, events });
});

/**
 * Создать recurring-события для привычки. Возвращает массив событий.
 * Вызывается из авто-синка при CRUD привычек, а также по /sync.
 */
export function syncHabitInternal(user: AuthUser, habitId: string): CalendarEvent[] | null {
  if (!tokens.has(user.id)) return null;
  const habit = getHabitById(habitId);
  if (!habit) return null;
  if (!habit.reminderTime) return null;

  const until = new Date();
  until.setFullYear(until.getFullYear() + 1);
  const [h, m] = habit.reminderTime.split(":").map(Number);
  const start = new Date();
  start.setHours(h ?? 9, m ?? 0, 0, 0);

  const evts: CalendarEvent[] = [
    {
      singleId: crypto.randomBytes(6).toString("hex"),
      exid: `ev_${habitId}`,
      habitId,
      title: `${habit.emoji} ${habit.name}`,
      start: start.toISOString(),
      until: until.toISOString(),
      frequency: FREQ_LABEL(habit.frequency),
    },
  ];
  events.set(habitId, evts);
  return evts;
}

/** Удалить события привычки из календаря (при удалении привычки) */
export function clearHabitEvents(habitId: string): void {
  events.delete(habitId);
}

// ---------- Вспомогательное (для проверки в мок-интерфейсе) ----------

/** Отдать список событий пользователя (только для мок-интерфейса) */
export const getUserEvents = (userId: string) =>
  [...events.values()].flat().filter((e) => e.habitId);

export default router;