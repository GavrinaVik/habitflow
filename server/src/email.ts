import { Router } from "express";
import crypto from "node:crypto";
import type { Request, Response } from "express";
import { getSessionUser } from "./auth.js";

/**
 * Unisender (мок). Сервис транзакционных писем и рассылок.
 *
 * В проде письма уходят через HTTP API Unisender (sendEmail отвечает
 * id письма), здесь — записываются в лог `sentEmails`, который можно
 * посмотреть через GET /api/email/log (только админ).
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "registration",
    name: "Подтверждение регистрации",
    subject: "Добро пожаловать в HabitFlow! 🎉",
    body: `Здравствуйте, {{имя}}!\n\nСпасибо за регистрацию в HabitFlow. Подтвердите адрес почты, чтобы активировать аккаунт:\n\n{{ссылка}}\n\nЕсли вы не регистрировались — просто проигнорируйте это письмо.\n\n— команда HabitFlow`,
  },
  {
    id: "receipt",
    name: "Чек об оплате",
    subject: "Чек об оплате HabitFlow",
    body: `Здравствуйте, {{имя}}!\n\nВаш чек за тариф «{{тариф}}»:\n• Сумма: {{сумма}} ₽\n• Номер чека: {{чек}}\n\nСпасибо, что растите вместе с нами! 🌱\n\n— команда HabitFlow`,
  },
  {
    id: "bonuses",
    name: "Бонусы партнёров Premium",
    subject: "Ваши бонусы Premium 🎁",
    body: `Здравствуйте, {{имя}}!\n\nКак владелец тарифа Premium вы получаете бонусы от наших партнёров:\n\n{{бонусы}}\n\nИспользуйте промокоды до указанной даты.\n\n— команда HabitFlow`,
  },
  {
    id: "tariff_change",
    name: "Смена тарифа",
    subject: "Ваш тариф изменён",
    body: `Здравствуйте, {{имя}}!\n\nВаш тариф теперь — «{{тариф}}». Изменения уже вступили в силу.\n\nЕсли это ошибка — напишите нам на support@habitflow.app\n\n— команда HabitFlow`,
  },
  {
    id: "password_reset",
    name: "Восстановление пароля",
    subject: "Сброс пароля в HabitFlow",
    body: `Здравствуйте!\n\nДля сброса пароля перейдите по ссылке:\n\n{{ссылка}}\n\nСсылка действует 1 час.\n\n— команда HabitFlow`,
  },
  {
    id: "weekly_digest",
    name: "Еженедельный дайджест",
    subject: "Ваш прогресс за неделю 📈",
    body: `Здравствуйте, {{имя}}!\n\nВот ваша неделя в цифрах:\n• Выполнено дней: {{выполнено}}\n• Лучшая серия: {{серия}}\n• Средний прогресс: {{средний}}%\n\nНе останавливайтесь — привычки копятся! 🔥\n\n— команда HabitFlow`,
  },
  {
    id: "onboarding_1",
    name: "Серия «Как не бросить привычку» №1",
    subject: "Шаг 1: Начните с малого",
    body: `Привет, {{имя}}!\n\nПравило «двух минут»: новая привычка должна занимать не больше 2 минут в день. Так мозг не сопротивляется.\n\nГотовы? Отметьте первую привычку сегодня!\n\n— команда HabitFlow`,
  },
  {
    id: "onboarding_2",
    name: "Серия «Как не бросить привычку» №2",
    subject: "Шаг 2: Привяжите привычку к триггеру",
    body: `Привет, {{имя}}!\n\nСвяжите новую привычку с существующей: «После <старое действие> я делаю <новое>». Например: после утреннего кофе — зарядка.\n\n— команда HabitFlow`,
  },
  {
    id: "onboarding_3",
    name: "Серия «Как не бросить привычку» №3",
    subject: "Шаг 3: Не пропускайте два дня подряд",
    body: `Привет, {{имя}}!\n\nОдин пропуск — случайность, два подряд — начало конца. Сделайте правилом: пропуск только один раз.\n\n— команда HabitFlow`,
  },
  {
    id: "onboarding_4",
    name: "Серия «Как не бросить привычку» №4",
    subject: "Шаг 4: Вознаграждайте себя",
    body: `Привет, {{имя}}!\n\nПразднуйте маленькие победы. Серия в 7 дней — повод сделать себе подарок. Отметьте в календаре, что сегодня — ваша победа.\n\n— команда HabitFlow`,
  },
  {
    id: "onboarding_5",
    name: "Серия «Как не бросить привычку» №5",
    subject: "Шаг 5: Среда важнее силы воли",
    body: `Привет, {{имя}}!\n\nОдиночный ритуал легко бросить. Добавьте привычку в «социальный контракт»: расскажите другу или поделитесь прогрессом.\n\n— команда HabitFlow`,
  },
];

export interface SentEmail {
  id: string;
  to: string;
  templateId: string;
  subject: string;
  body: string;
  at: string;
}

const sentEmails: SentEmail[] = [];
const subscribers = new Set<string>();
const lastDigestAt = new Map<string, number>(); // email -> дата последнего дайджеста
const MAX_LOG = 500;

/** Подставить переменные {{ключ}} из variables */
const render = (text: string, variables: Record<string, string | number>) =>
  Object.entries(variables).reduce(
    (acc, [k, v]) => acc.replaceAll(`{{${k}}}`, String(v)),
    text
  );

export interface SendEmailOptions {
  to: string;
  templateId: string;
  variables?: Record<string, string | number>;
}

/** Отправить письмо (в проде — HTTP-вызов Unisender, здесь — лог) */
export function sendEmail(options: SendEmailOptions): SentEmail | null {
  const tpl = EMAIL_TEMPLATES.find((t) => t.id === options.templateId);
  if (!tpl) return null;
  const subject = render(tpl.subject, options.variables ?? {});
  const body = render(tpl.body, options.variables ?? {});
  const entry: SentEmail = {
    id: crypto.randomBytes(6).toString("hex"),
    to: options.to.toLowerCase(),
    templateId: tpl.id,
    subject,
    body,
    at: new Date().toISOString(),
  };
  sentEmails.unshift(entry);
  if (sentEmails.length > MAX_LOG) sentEmails.length = MAX_LOG;
  console.log(`[mock-email] → ${entry.to}: ${subject}`);
  return entry;
}

/** Подписать email на рассылку (возвращает true, если подписан) */
export function subscribeEmail(email: string): boolean {
  if (!email.includes("@")) return false;
  subscribers.add(email.toLowerCase());
  return true;
}

/** Отписать email от рассылки */
export function unsubscribeEmail(email: string): void {
  subscribers.delete(email.toLowerCase());
}

export const isSubscribed = (email: string) => subscribers.has(email.toLowerCase());
export const getSubscribers = () => [...subscribers];

/**
 * Серия из 5 писем «Как не бросить привычку» для новых Free-пользователей.
 * Первое уходит сразу, остальные — «запланированными» копиями.
 */
export function runOnboarding(email: string, name: string): void {
  subscribeEmail(email);
  sendEmail({ to: email, templateId: "onboarding_1", variables: { имя: name } });
  ["onboarding_2", "onboarding_3", "onboarding_4", "onboarding_5"].forEach((id, i) => {
    const when = new Date(Date.now() + (i + 1) * 86400000).toISOString();
    console.log(`[mock-email] ⏰ запланировано через ${i + 1} дн.: ${id} → ${email}`);
    sentEmails.unshift({
      id: crypto.randomBytes(6).toString("hex"),
      to: email.toLowerCase(),
      templateId: id,
      subject: `[план] ${EMAIL_TEMPLATES.find((t) => t.id === id)?.subject}`,
      body: `Запланировано на ${when}\n`,
      at: when,
    });
  });
}

/**
 * Еженедельный дайджест для Pro/Premium подписчиков.
 * Отправляется не чаще раза в 7 дней (запускается при входе).
 */
export function trySendWeeklyDigest(
  user: { id: string; email: string; name: string; plan: string }
): void {
  if (!["pro", "premium"].includes(user.plan)) return;
  if (!subscribers.has(user.email.toLowerCase())) return;
  const last = lastDigestAt.get(user.id);
  if (last && Date.now() - last < 7 * 86400000) return;
  lastDigestAt.set(user.id, Date.now());
  sendEmail({
    to: user.email,
    templateId: "weekly_digest",
    variables: { имя: user.name, выполнено: 5, серия: 3, средний: 78 },
  });
}

// ---------- Маршруты ----------

const router = Router();

const requireSession = (req: Request, res: Response): { user?: ReturnType<typeof getSessionUser> } => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Не авторизован" });
  }
  return { user };
};

/** Отправить письмо по шаблону (требуется вход в систему) */
router.post("/send", (req, res) => {
  const { user } = requireSession(req, res);
  if (!user) return;
  const { to, template_id: templateId, variables } = req.body ?? {};
  const email = String(to ?? "").trim().toLowerCase();
  if (!email.includes("@")) {
    res.status(400).json({ error: "Некорректный email получателя" });
    return;
  }
  if (!EMAIL_TEMPLATES.some((t) => t.id === templateId)) {
    res.status(400).json({ error: "Неизвестный шаблон письма" });
    return;
  }
  const sent = sendEmail({ to: email, templateId, variables: variables ?? {} });
  res.json({ ok: true, id: sent?.id, subject: sent?.subject });
});

/** Подписаться на рассылку */
router.post("/subscribe", (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const ok = subscribeEmail(email);
  if (!ok) {
    res.status(400).json({ error: "Некорректный email" });
    return;
  }
  res.json({ ok: true, subscribed: true });
});

/** Отписаться от рассылки */
router.post("/unsubscribe", (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  unsubscribeEmail(email);
  res.json({ ok: true, subscribed: false });
});

/** Лог отправленных писем (только админ, для проверки работы интеграции) */
router.get("/log", (req, res) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: "Не авторизован" });
  if (user.role !== "admin") return res.status(403).json({ error: "Доступ только для администратора" });
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  res.json(sentEmails.slice(0, limit));
});

export default router;