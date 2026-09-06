import { Router } from "express";
import {
  PLANS,
  PRICING_FAQ,
  FAQ,
  getHabits,
  getHabitById,
  createHabit,
  updateHabit,
  deleteHabit,
  logHabit,
  getHabitStats,
  getHabitHistory,
  exportHabitCsv,
} from "./data.js";
import { getSessionUser } from "./auth.js";
import { syncHabitInternal, clearHabitEvents } from "./calendar.js";

/** Если пользователь подключил Google Calendar — синхронизируем привычку */
const notifyCalendarSync = (req: import("express").Request, habitId: string) => {
  try {
    const user = getSessionUser(req);
    if (user) syncHabitInternal(user, habitId);
  } catch {
    /* календарь — не блокирует CRUD привычек */
  }
};

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "habitflow-api", time: new Date().toISOString() });
});

router.get("/pricing", (_req, res) => {
  res.json(PLANS);
});

router.get("/pricing/faq", (_req, res) => {
  res.json(PRICING_FAQ);
});

router.get("/faq", (_req, res) => {
  res.json(FAQ);
});

router.get("/habits", (_req, res) => {
  res.json(getHabits());
});

router.post("/habits", (req, res) => {
  const { name, emoji, target, unit, color, frequency, reminderTime } = req.body ?? {};
  if (!name || typeof target !== "number" || target <= 0) {
    res.status(400).json({ error: "Параметры name и target (число > 0) обязательны" });
    return;
  }
  const habit = createHabit({
    name: String(name),
    emoji: String(emoji ?? "⭐"),
    target,
    unit: String(unit ?? "раз"),
    color: String(color ?? "#10b981"),
    frequency: String(frequency ?? "daily"),
    reminderTime:
      typeof reminderTime === "string" && reminderTime.trim() ? reminderTime : null,
  });
  notifyCalendarSync(req, habit.id);
  res.status(201).json(habit);
});

/** Детали привычки */
router.get("/habits/:id", (req, res) => {
  const habit = getHabitById(req.params.id);
  if (!habit) {
    res.status(404).json({ error: "Привычка не найдена" });
    return;
  }
  res.json(habit);
});

/** Обновить привычку (имя, эмодзи, цель, единицы, цвет) */
router.put("/habits/:id", (req, res) => {
  const habit = updateHabit(req.params.id, req.body ?? {});
  if (!habit) {
    res.status(404).json({ error: "Привычка не найдена" });
    return;
  }
  notifyCalendarSync(req, habit.id);
  res.json(habit);
});

/** Удалить привычку */
router.delete("/habits/:id", (req, res) => {
  if (!deleteHabit(req.params.id)) {
    res.status(404).json({ error: "Привычка не найдена" });
    return;
  }
  clearHabitEvents(req.params.id);
  res.json({ ok: true });
});

/** Отметить выполнение за сегодня: value — сколько реально сделано */
router.post("/habits/:id/log", (req, res) => {
  const value = Number(req.body?.value);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    res.status(400).json({ error: "Требуется параметр value (число)" });
    return;
  }
  const habit = logHabit(req.params.id, Math.max(0, value));
  if (!habit) {
    res.status(404).json({ error: "Привычка не найдена" });
    return;
  }
  res.json(habit);
});

/** Статистика привычки для детальной страницы */
router.get("/habits/:id/stats", (req, res) => {
  const stats = getHabitStats(req.params.id);
  if (!stats) {
    res.status(404).json({ error: "Привычка не найдена" });
    return;
  }
  res.json(stats);
});

/** История с пагинацией: GET /habits/:id/history?page=1&limit=10 */
router.get("/habits/:id/history", (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const data = getHabitHistory(req.params.id, page, limit);
  if (!data) {
    res.status(404).json({ error: "Привычка не найдена" });
    return;
  }
  res.json(data);
});

/** Экспорт истории в CSV (Pro/Premium) */
router.get("/habits/:id/export", (req, res) => {
  const csv = exportHabitCsv(req.params.id);
  if (!csv) {
    res.status(404).json({ error: "Привычка не найдена" });
    return;
  }
  res
    .type("text/csv; charset=utf-8")
    .set("Content-Disposition", `attachment; filename="habit-${req.params.id}.csv"`)
    .send(`\uFEFF${csv}`);
});

export default router;