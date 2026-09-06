import { Router } from "express";
import type { Request, Response } from "express";
import crypto from "node:crypto";
import { getSessionUser, getAuthUserById, type AuthUser } from "./auth.js";
import { addPayment, getActiveBonuses } from "./admin.js";
import { sendEmail } from "./email.js";

/**
 * ЮKassa (мок).
 *
 * В реальном проде сервис подключается через HTTP API ЮKassa:
 *   POST https://api.yookassa.ru/v3/payments → { id, confirmation_url, ... }
 * Пользователь оплачивает на confirmation_url, сервис шлёт webhook
 * на /api/payments/webhook с событиями payment.succeeded / payment.canceled.
 *
 * Здесь сервис эмулируется: «оплата» происходит на мок-странице /pay/:id,
 * которая вызывает GET /api/payments/:id/pay — аналог webhook-события
 * payment.succeeded. Статус можно посмотреть через GET /api/payments/:id.
 */

const PLAN_KEYS = ["free", "pro", "premium"] as const;
type PlanKey = (typeof PLAN_KEYS)[number];
const isPlan = (p: unknown): p is PlanKey => PLAN_KEYS.includes(p as PlanKey);

interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  plan: PlanKey;
  period: "month" | "year";
  /** ЮKassa-статус платёжного объекта */
  status: "pending" | "succeeded" | "canceled";
  redirectUrl: string;
  createdAt: string;
}

/** Активные платежи (в памяти). */
const payments = new Map<string, PaymentRecord>();

const planName = (plan: PlanKey) =>
  plan === "premium" ? "Premium" : plan === "pro" ? "Pro" : "Free";

/** Цена в ₽ по тарифу и периоду (совпадает с тарифами на странице) */
const priceFor = (plan: PlanKey, period: "month" | "year"): number => {
  const prices: Record<PlanKey, { month: number; year: number }> = {
    free: { month: 0, year: 0 },
    pro: { month: 299, year: 2990 },
    premium: { month: 399, year: 2990 },
  };
  return period === "year" ? prices[plan].year : prices[plan].month;
};

const requireSession = (req: Request, res: Response): AuthUser | undefined => {
  const user = getSessionUser(req);
  if (!user) res.status(401).json({ error: "Не авторизован" });
  return user;
};

/** Завершить платёж как успешный — аналог обработки payment.succeeded */
function activatePayment(user: AuthUser, p: PaymentRecord): void {
  p.status = "succeeded";
  user.plan = p.plan;

  // Продлеваем/устанавливаем срок тарифа
  const days = p.period === "year" ? 365 : 30;
  const base =
    user.planExpiresAt && new Date(user.planExpiresAt).getTime() > Date.now()
      ? new Date(user.planExpiresAt).getTime()
      : Date.now();
  user.planExpiresAt = new Date(base + days * 86400000).toISOString();

  const receiptId = `CH-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  addPayment({
    userId: user.id,
    userName: user.name,
    amount: p.amount,
    plan: p.plan,
    status: "paid",
    receiptId,
  });

  sendEmail({
    to: user.email,
    templateId: "receipt",
    variables: { имя: user.name, тариф: planName(p.plan), сумма: p.amount, чек: receiptId },
  });

  // Для Premium дополнительно высылаем бонусы партнёров (маркетинговая рассылка)
  if (p.plan === "premium") {
    const bonuses = getActiveBonuses();
    if (bonuses.length) {
      const list = bonuses.map((b) => `• ${b.name} — промокод ${b.promoCode}`).join("\n");
      sendEmail({
        to: user.email,
        templateId: "bonuses",
        variables: { имя: user.name, бонусы: list },
      });
    }
  }
}

// ---------- Маршруты ----------

const router = Router();

/** Создать платёж: POST /api/payments/create { plan, period } -> { payment_id, payment_url } */
router.post("/create", (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  const { plan, period } = req.body ?? {};
  const p = String(plan ?? "");
  const per = period === "year" ? "year" : "month";
  if (!isPlan(p) || p === "free") {
    return void res.status(400).json({ error: "Укажите платный тариф: pro или premium" });
  }
  if (!user.email) return void res.status(400).json({ error: "У пользователя нет email для чека" });

  const amount = priceFor(p, per);
  const id = `pay_${crypto.randomBytes(8).toString("hex")}`;
  const rec: PaymentRecord = {
    id,
    userId: user.id,
    amount,
    plan: p,
    period: per,
    status: "pending",
    redirectUrl: `http://localhost:5173/pay/${id}`,
    createdAt: new Date().toISOString(),
  };
  payments.set(id, rec);
  res.status(201).json({ payment_id: id, payment_url: rec.redirectUrl, amount });
});

/** Статус платежа: GET /api/payments/:id */
router.get("/:id", (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  const p = payments.get(req.params.id);
  if (!p) return void res.status(404).json({ error: "Платёж не найден" });
  if (p.userId !== user.id) return void res.status(403).json({ error: "Чужой платёж" });
  res.json({ payment_id: p.id, status: p.status, amount: p.amount, plan: p.plan, period: p.period });
});

/**
 * Мок-вариант webhook: GET /api/payments/:id/pay — «оплатили на странице ЮKassa».
 * В проде это делал бы наш endpoint POST /api/payments/webhook по событию
 * payment.succeeded от ЮKassa; здесь флаги success/cancel имитируют события.
 */
router.get("/:id/pay", (req, res) => {
  const user = requireSession(req, res);
  if (!user) return;
  const p = payments.get(req.params.id);
  if (!p) return void res.status(404).json({ error: "Платёж не найден" });
  if (p.userId !== user.id) return void res.status(403).json({ error: "Чужой платёж" });
  if (p.status !== "pending") {
    return res.json({ ok: true, status: p.status, already: true });
  }
  const result = req.query.result === "cancel" ? "canceled" : "succeeded";
  if (result === "succeeded") {
    activatePayment(user, p);
  } else {
    p.status = "canceled";
  }
  res.json({ ok: true, status: p.status });
});

/**
 * Настоящий webhook от ЮKassa (для продакшена). Обрабатывает события
 * payment.succeeded и payment.canceled, обновляя тариф пользователя.
 * Здесь вызывается вручную/инструментами для демонстрации.
 */
router.post("/webhook", (req, res) => {
  const body = req.body ?? {};
  const id = body?.object?.id ?? body?.payment_id;
  const event = body?.event;
  const p = id ? payments.get(String(id)) : undefined;
  if (!p) {
    return void res.status(404).json({ error: "Платёж не найден" });
  }
  if (event === "payment.succeeded" && p.status === "pending") {
    const user = getAuthUserById(p.userId);
    if (user) activatePayment(user, p);
  } else if (event === "payment.canceled") {
    p.status = "canceled";
  }
  res.json({ ok: true });
});

export default router;