import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import type { Request, Response } from "express";
import { sendEmail, runOnboarding, trySendWeeklyDigest, subscribeEmail, unsubscribeEmail } from "./email.js";

const TOKEN_COOKIE = "habitflow_token";
const JWT_SECRET = process.env.JWT_SECRET ?? "habitflow-dev-secret-change-me";
const DEV_MODE = process.env.NODE_ENV !== "production";

// Ограничение входа: максимум 5 попыток за 15 минут (на email + IP)
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  plan: string;
  role: "user" | "admin";
  provider?: string;
  /** Подтверждён ли email (ссылка из письма) */
  emailConfirmed?: boolean;
  /** ISO-дата окончания платного тарифа */
  planExpiresAt?: string;
  /** Подписан ли на рассылку */
  subscribed?: boolean;
}

const PROVIDERS = ["vk", "telegram", "google", "yandex", "apple"] as const;

// --- In-memory хранилище (на следующем этапе заменим на PostgreSQL) ---
const users: AuthUser[] = [
  {
    id: "usr_demo",
    name: "Алекс",
    email: "alex@habitflow.app",
    passwordHash: bcrypt.hashSync("habitflow123", 10),
    plan: "pro",
    role: "user",
    emailConfirmed: true,
    subscribed: true,
    planExpiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  },
  {
    id: "usr_admin",
    name: "Администратор",
    email: "admin@habitflow.app",
    passwordHash: bcrypt.hashSync("admin123", 10),
    plan: "premium",
    role: "admin",
    emailConfirmed: true,
    subscribed: true,
    planExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
  },
];

// Токены сброса пароля: token -> { email, expiresAt }
const resetTokens = new Map<string, { email: string; expiresAt: number }>();
// Токены подтверждения email: token -> { email, expiresAt }
const confirmTokens = new Map<string, { email: string; expiresAt: number }>();
// Неудачные попытки входа: key(email|ip) -> { count, first }
const loginAttempts = new Map<string, { count: number; first: number }>();

// ---------- Утилиты ----------

/** Безопасное представление пользователя (без хеша пароля) */
const publicUser = (u: AuthUser) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  plan: u.plan,
  role: u.role,
  provider: u.provider,
  emailConfirmed: Boolean(u.emailConfirmed),
  planExpiresAt: u.planExpiresAt ?? null,
  subscribed: Boolean(u.subscribed),
});

/** Доступ ко всем пользователям (для админ-панели) */
export const getAuthUsers = () => users;

/** Найти пользователя по ID (для админ-панели) */
export const getAuthUserById = (id: string) => users.find((u) => u.id === id);

/** Выпустить JWT и положить в httpOnly-cookie */
const setAuthCookie = (res: Response, user: AuthUser, remember: boolean) => {
  const token = jwt.sign({ sub: user.id }, JWT_SECRET, {
    expiresIn: remember ? "30d" : "1d",
  });
  res.cookie(TOKEN_COOKIE, token, {
    httpOnly: true, // недоступен из JS — защита от XSS
    sameSite: "lax",
    secure: DEV_MODE ? false : true,
    maxAge: (remember ? 30 : 1) * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

/** Достать текущего пользователя по cookie-токену */
export const getSessionUser = (req: Request): AuthUser | undefined => {
  const token = (req.cookies as Record<string, string> | undefined)?.[TOKEN_COOKIE];
  if (!token) return undefined;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    return users.find((u) => u.id === payload.sub);
  } catch {
    return undefined;
  }
};

const rateKey = (email: string, ip: string) => `${ip}|${email.toLowerCase().trim()}`;

/** Проверка лимита попыток входа */
const checkRateLimit = (key: string): { allowed: boolean; retryAfterMs?: number } => {
  const rec = loginAttempts.get(key);
  if (!rec) return { allowed: true };
  if (Date.now() - rec.first > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key);
    return { allowed: true };
  }
  if (rec.count >= LOGIN_MAX_ATTEMPTS) {
    return { allowed: false, retryAfterMs: rec.first + LOGIN_WINDOW_MS - Date.now() };
  }
  return { allowed: true };
};

const recordFailure = (key: string) => {
  const rec = loginAttempts.get(key) ?? { count: 0, first: Date.now() };
  rec.count += 1;
  loginAttempts.set(key, rec);
};

const clearFailures = (key: string) => loginAttempts.delete(key);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------- Роуты ----------

const router = Router();

/**
 * Регистрация. Защита от спама: honeypot-поле hp — если оно заполнено,
 * боту отвечаем «успехом», но пользователя не создаём.
 */
router.post("/register", (req, res) => {
  const { name, email, password, hp } = req.body ?? {};

  if (hp) {
    // Бот в honeypot — притворяемся успехом
    return res.status(200).json({ ok: true });
  }

  const cleanEmail = String(email ?? "").trim().toLowerCase();
  const cleanName = String(name ?? "").trim();

  if (cleanName.length < 2) {
    return res.status(400).json({ error: "Имя должно содержать минимум 2 символа" });
  }
  if (!EMAIL_RE.test(cleanEmail)) {
    return res.status(400).json({ error: "Некорректный формат email" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Пароль должен содержать минимум 8 символов" });
  }
  if (users.some((u) => u.email === cleanEmail)) {
    return res.status(409).json({ error: "Пользователь с таким email уже существует" });
  }

  const user: AuthUser = {
    id: `usr_${crypto.randomBytes(6).toString("hex")}`,
    name: cleanName,
    email: cleanEmail,
    passwordHash: bcrypt.hashSync(password, 10), // bcrypt + соль
    plan: "free",
    role: "user",
    emailConfirmed: false,
    subscribed: false,
  };
  users.push(user);

  // Подтверждение email + старт серии «Как не бросить привычку»
  const token = crypto.randomBytes(32).toString("hex");
  confirmTokens.set(token, { email: cleanEmail, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  sendEmail({
    to: cleanEmail,
    templateId: "registration",
    variables: { имя: cleanName, ссылка: `http://localhost:5173/confirm-email?token=${token}` },
  });
  runOnboarding(cleanEmail, cleanName);

  setAuthCookie(res, user, true); // авто-вход после регистрации
  res.status(201).json({ user: publicUser(user) });
});

/** Вход с rate limiting (5 неудачных попыток за 15 минут) */
router.post("/login", (req, res) => {
  const { email, password, remember } = req.body ?? {};
  const cleanEmail = String(email ?? "").trim().toLowerCase();
  const key = rateKey(cleanEmail, req.ip ?? "?");

  const rate = checkRateLimit(key);
  if (!rate.allowed) {
    return res.status(429).json({
      error: "Слишком много попыток входа. Попробуйте позже.",
      retryAfter: Math.ceil((rate.retryAfterMs ?? 0) / 1000),
    });
  }

  const user = users.find((u) => u.email === cleanEmail);
  const passwordOk =
    user && typeof password === "string" && bcrypt.compareSync(password, user.passwordHash);

  if (!user || !passwordOk) {
    recordFailure(key);
    return res.status(401).json({ error: "Неверный email или пароль" });
  }

  clearFailures(key);
  setAuthCookie(res, user, Boolean(remember));
  // Для Pro/Premium подписчиков — еженедельный дайджест (не чаще раза в 7 дней)
  if (user.subscribed) {
    try { trySendWeeklyDigest(user); } catch { /* не критично */ }
  }
  res.json({ user: publicUser(user) });
});

/** Выход: стираем cookie */
router.post("/logout", (_req, res) => {
  res.clearCookie(TOKEN_COOKIE, { path: "/" });
  res.json({ ok: true });
});

/** Текущий пользователь по cookie */
router.get("/me", (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизован" });
  res.json({ user: publicUser(user) });
});

/** Подтвердить email по токену из письма */
router.post("/confirm", (req, res) => {
  const { token } = req.body ?? {};
  const entry = typeof token === "string" ? confirmTokens.get(token) : undefined;
  if (!entry || Date.now() > entry.expiresAt) {
    confirmTokens.delete(token);
    return res.status(400).json({ error: "Ссылка подтверждения недействительна или истекла" });
  }
  const user = users.find((u) => u.email === entry.email);
  confirmTokens.delete(token);
  if (!user) return res.status(400).json({ error: "Пользователь не найден" });
  user.emailConfirmed = true;
  if (!user.subscribed) user.subscribed = subscribeEmail(user.email);
  setAuthCookie(res, user, true);
  res.json({ ok: true, user: publicUser(user) });
});

/** Повторно отправить письмо подтверждения email (для текущего пользователя) */
router.post("/resend-confirm", (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизован" });
  if (user.emailConfirmed) return res.json({ ok: true, already: true });
  const token = crypto.randomBytes(32).toString("hex");
  confirmTokens.set(token, { email: user.email, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
  sendEmail({
    to: user.email,
    templateId: "registration",
    variables: { имя: user.name, ссылка: `http://localhost:5173/confirm-email?token=${token}` },
  });
  res.json({ ok: true });
});

/** Управление подпиской на маркетинговые рассылки */
router.post("/subscribe", (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизован" });
  const { subscribed } = req.body ?? {};
  if (subscribed === false) {
    unsubscribeEmail(user.email);
    user.subscribed = false;
  } else {
    user.subscribed = subscribeEmail(user.email);
  }
  res.json({ user: publicUser(user) });
});

/**
 * Запрос сброса пароля. Всегда отвечаем одинаково, чтобы не раскрывать,
 * существует ли email. Письмо отправляем через Unisender (здесь — мок).
 * В dev-режиме возвращаем resetUrl для удобного тестирования.
 */
router.post("/forgot-password", (req, res) => {
  const { email } = req.body ?? {};
  const cleanEmail = String(email ?? "").trim().toLowerCase();
  const user = users.find((u) => u.email === cleanEmail);

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    resetTokens.set(token, { email: cleanEmail, expiresAt: Date.now() + 60 * 60 * 1000 });
    const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
    // Письмо со ссылкой восстановления через Unisender
    sendEmail({
      to: cleanEmail,
      templateId: "password_reset",
      variables: { ссылка: resetUrl },
    });
    if (DEV_MODE) return res.json({ ok: true, resetUrl });
  }

  res.json({ ok: true });
});

/** Сброс пароля по токену из письма */
router.post("/reset-password", (req, res) => {
  const { token, password } = req.body ?? {};
  const entry = typeof token === "string" ? resetTokens.get(token) : undefined;

  if (!entry || Date.now() > entry.expiresAt) {
    resetTokens.delete(token);
    return res.status(400).json({ error: "Ссылка для сброса недействительна или истекла" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Пароль должен содержать минимум 8 символов" });
  }

  const user = users.find((u) => u.email === entry.email);
  if (user) {
    user.passwordHash = bcrypt.hashSync(password, 10);
    resetTokens.delete(token); // одноразовый токен
  }
  res.json({ ok: true });
});

/**
 * OAuth через соцсети. На этом этапе — мок: создаём/находим пользователя
 * провайдера и сразу авторизуем. Реальную интеграцию (VK OAuth, Google OAuth,
 * Яндекс ID и т.д.) добавим после подключения БД.
 */
router.post("/oauth/:provider", (req, res) => {
  const provider = req.params.provider as (typeof PROVIDERS)[number];
  if (!PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: "Неизвестный провайдер OAuth" });
  }

  const existing = users.find((u) => u.provider === provider);
  if (existing) {
    setAuthCookie(res, existing, true);
    return res.json({ user: publicUser(existing) });
  }

  const user: AuthUser = {
    id: `oauth_${provider}_${crypto.randomBytes(4).toString("hex")}`,
    name: provider.charAt(0).toUpperCase() + provider.slice(1),
    email: `${provider}.${crypto.randomBytes(4).toString("hex")}@mock.habitflow.app`,
    passwordHash: "", // OAuth-пользователи входят только через провайдера
    plan: "free",
    role: "user",
    provider,
    emailConfirmed: true,
    subscribed: true,
  };
  users.push(user);

  setAuthCookie(res, user, true);
  res.status(201).json({ user: publicUser(user) });
});

export default router;