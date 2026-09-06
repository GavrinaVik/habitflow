import { Router, type NextFunction, type Request, type Response } from "express";
import crypto from "node:crypto";
import { getSessionUser, getAuthUserById, type AuthUser } from "./auth.js";
import { FAQ as SEED_FAQ } from "./data.js";
import { sendEmail } from "./email.js";

const planToName = (plan: string) => (plan === "premium" ? "Premium" : plan === "pro" ? "Pro" : "Free");

// ==============================================================
// In-memory админ-данные (демо). На следующем этапе — PostgreSQL.
// ==============================================================

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro" | "premium";
  registeredAt: string;
  lastActive: string;
  blocked: boolean;
  habits: number;
  daysActive: number;
  totalPaid: number;
  actions: { at: string; action: string }[];
}

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  plan: string;
  status: "paid" | "failed" | "refunded";
  date: string;
  receiptId: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  admin: string;
  action: string;
  detail: string;
}

export interface Motivation {
  id: string;
  text: string;
  emoji: string;
}

export interface ContentFaq {
  id: string;
  question: string;
  answer: string;
}

export interface PartnerBonus {
  id: string;
  name: string;
  description: string;
  link: string;
  promoCode: string;
  expiresAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export interface AdminSettings {
  prices: { proMonthly: number; proYearly: number; premiumMonthly: number; premiumYearly: number };
  adsForFree: boolean;
  privacyText: string;
  offerText: string;
  emailTemplates: EmailTemplate[];
}

// ---------- Детерминированный генератор демо-данных ----------

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const rand = mulberry32(20260214);

const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

const FIRST = [
  "Алексей", "Мария", "Дмитрий", "Анна", "Сергей", "Елена", "Иван", "Ольга",
  "Павел", "Наталья", "Артём", "Ксения", "Никита", "Виктория", "Максим", "Дарья",
  "Егор", "Полина", "Тимур", "Софья", "Роман", "Алиса", "Владимир", "Ева",
];
const LAST = [
  "Иванов", "Петров", "Смирнов", "Кузнецов", "Соколов", "Попов", "Лебедев",
  "Козлов", "Новиков", "Морозов", "Волков", "Соловьёв", "Васильев", "Зайцев",
  "Павлов", "Семёнов", "Голубев", "Виноградов", "Богданов", "Воробьёв",
];

const DAY = 86400000;
const iso = (d: Date) => d.toISOString();
const day = (d: Date) => d.toISOString().slice(0, 10);

// Список пользователей — 1234 записи для реалистичной админки
/** Записать реальный платёж в общий журнал платежей (для админки) */
export const addPayment = (p: Omit<Payment, "id" | "date"> & { id?: string; date?: string }): Payment => {
  const entry: Payment = {
    id: p.id ?? `pay_${Date.now()}`,
    userId: p.userId,
    userName: p.userName,
    amount: p.amount,
    plan: p.plan,
    status: p.status,
    date: p.date ?? new Date().toISOString(),
    receiptId: p.receiptId,
  };
  payments.unshift(entry);
  return entry;
};

/** Актуальные бонусы партнёров (срок ещё не истёк) */
export const getActiveBonuses = (): PartnerBonus[] => {
  const today = new Date().toISOString().slice(0, 10);
  return bonuses.filter((b) => b.expiresAt >= today);
};

const users: AdminUser[] = (() => {
  const list: AdminUser[] = [];
  const plans: AdminUser["plan"][] = []; // сборка весов: free — много
  for (let i = 0; i < 1234; i++) {
    const r = rand();
    plans.push(r < 0.62 ? "free" : r < 0.88 ? "pro" : "premium");
  }
  for (let i = 0; i < 1234; i++) {
    const plan = plans[i];
    const registeredAt = new Date(Date.now() - Math.floor(rand() * 365) * DAY - Math.floor(rand() * DAY));
    const activeOffset = Math.floor(rand() * 30) * DAY;
    const lastActive = new Date(Math.min(Date.now(), Date.now() - Math.floor(rand() * activeOffset)));
    const firstName = pick(FIRST);
    const lastName = pick(LAST);
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@mail.ru`;
    const habits =
      plan === "free" ? Math.floor(rand() * 4) : plan === "pro" ? 5 + Math.floor(rand() * 6) : 6 + Math.floor(rand() * 20);
    const daysActive = Math.floor(rand() * 90);
    const months = Math.max(1, Math.floor((Date.now() - registeredAt.getTime()) / (30 * DAY)));
    const totalPaid =
      plan === "pro" ? 299 * months : plan === "premium" ? 2990 * months : 0;
    const actions = seedActions(day(registeredAt), name, Math.min(6, 2 + Math.floor(rand() * 4)));

    list.push({
      id: `u_${String(i + 1).padStart(4, "0")}`,
      name,
      email,
      plan,
      registeredAt: iso(registeredAt),
      lastActive: iso(lastActive),
      blocked: rand() < 0.03,
      habits,
      daysActive,
      totalPaid,
      actions,
    });
  }
  return list.sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
})();

/** Псевдо-лог активности пользователя на заданный период */
function seedActions(from: string, userName: string, count: number): AdminUser["actions"] {
  const actions: AdminUser["actions"] = [];
  const kinds = ["Регистрация", "Создание привычки", "Оплата тарифа", "Вход", "Отметка выполнения"];
  for (let i = 0; i < count; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i * 3);
    actions.unshift({
      at: iso(d),
      action: i === 0 ? "Регистрация" : pick(kinds),
    });
  }
  return actions;
}

// Платежи за 12 месяцев (~520 записей)
const payments: Payment[] = (() => {
  const list: Payment[] = [];
  for (let i = 0; i < 540; i++) {
    const u = pick(users);
    const d = new Date(Date.now() - Math.floor(rand() * 365) * DAY);
    const r = rand();
    const status: Payment["status"] = r < 0.85 ? "paid" : r < 0.95 ? "failed" : "refunded";
    const plan = u.plan === "free" ? (status === "paid" ? "pro" : u.plan) : u.plan;
    const amount =
      plan === "pro" ? 299 : plan === "premium" ? 2990 : status === "paid" ? 299 : 0;
    list.push({
      id: `pay_${String(i + 1).padStart(5, "0")}`,
      userId: u.id,
      userName: u.name,
      amount,
      plan,
      status,
      date: iso(d),
      receiptId: `CH-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    });
  }
  return list.sort((a, b) => b.date.localeCompare(a.date));
})();

// Мотивационные фразы (синхронизированы с клиентскими)
const MOTIVATION_TEXTS = [
  "Ты крут! Так держать! 🚀", "Цель достигнута — ты супергерой! 🏆",
  "Идеальное выполнение! Гордимся тобой! 🌟", "Полный успех! Завтра продолжим! 💯",
  "Ты сделал это! Сегодня ты лучший! 🥇", "100% — это уровень чемпионов! 📈",
  "Отлично! Твои будущие серии любят тебя! 🔥", "Выполнено! Можешь собой гордиться! 🎉",
  "Хорошее начало! Завтра точно получится больше! 💪", "Каждый шаг приближает тебя к цели! 🎯",
  "Даже часть — это прогресс. Продолжай! 🌱", "Маленькие шаги — большие результаты! 🚀",
  "Ты уже молодец, что не бросил! 💪", "Небольшой вклад — а серия растёт! 📈",
  "Всё идёт по плану. Ещё чуть-чуть! ⚡", "Ты на пути! Не останавливайся! 🧗",
  "Начни прямо сейчас — первые минуты самые важные! 🌱", "Один маленький шаг — и ты в игре! 🎯",
  "Сегодня лучше, чем вчера — сделай первый! 📈", "Не откладывай — 5 минут и поехали! ⏰",
  "Твоя будущая серия начинается сегодня! 🔥", "Вперёд! Даже 1% лучше, чем ноль! 💪",
  "Не сдавайся, ты на правильном пути! 🚀", "Сделай сегодня хоть чуть-чуть — и ты молодец! 🌟",
];
let motivations: Motivation[] = MOTIVATION_TEXTS.map((t, i) => ({
  id: `m${i + 1}`,
  text: t.replace(/ [^\s]*$/, ""), // без эмодзи
  emoji: t.split(" ").pop() ?? "🌟",
}));

let contentFaq: ContentFaq[] = SEED_FAQ.map((f, i) => ({
  id: `f${i + 1}`,
  question: f.question,
  answer: f.answer,
}));

const BONUSES_SEED: Omit<PartnerBonus, "id">[] = [
  {
    name: "Яндекс Плюс",
    description: "1 месяц подписки в подарок при продлении Premium",
    link: "https://plus.yandex.ru",
    promoCode: "HABITFLOW",
    expiresAt: new Date(Date.now() + 90 * DAY).toISOString().slice(0, 10),
  },
  {
    name: "Читай-город",
    description: "Скидка 20% на книги по саморазвитию",
    link: "https://chitai-gorod.ru",
    promoCode: "GROW20",
    expiresAt: new Date(Date.now() + 120 * DAY).toISOString().slice(0, 10),
  },
  {
    name: "Спортмастер",
    description: "10% на первую покупку фитнес-товаров",
    link: "https://sportmaster.ru",
    promoCode: "FIT10",
    expiresAt: new Date(Date.now() + 60 * DAY).toISOString().slice(0, 10),
  },
];
let bonuses: PartnerBonus[] = BONUSES_SEED.map((b, i) => ({ id: `b${i + 1}`, ...b }));

let settings: AdminSettings = {
  prices: { proMonthly: 299, proYearly: 2990, premiumMonthly: 399, premiumYearly: 2990 },
  adsForFree: true,
  privacyText:
    "Мы уважаем вашу конфиденциальность. Данные аккаунта используются только для работы сервиса HabitFlow и не передаются третьим лицам.",
  offerText:
    "Нажимая кнопку «Оплатить», вы принимаете условия публичной оферты. Подписка продлевается автоматически.",
  emailTemplates: [
    {
      id: "tpl_welcome",
      name: "Приветственное письмо",
      subject: "Добро пожаловать в HabitFlow, {{имя}}!",
      body: "Здравствуйте, {{имя}}!\nРады видеть вас в HabitFlow. Создайте первую привычку и начните серию сегодня.\n\nКоманда HabitFlow",
    },
    {
      id: "tpl_receipt",
      name: "Чек об оплате",
      subject: "Чек об оплате тарифа {{тариф}}",
      body: "Здравствуйте, {{имя}}!\nВаш тариф {{тариф}} оплачен. Спасибо, что вы с нами!\n\nКоманда HabitFlow",
    },
    {
      id: "tpl_reminder",
      name: "Напоминание",
      subject: "Пора выполнить привычку «{{привычка}}»",
      body: "Здравствуйте, {{имя}}!\nНе забывайте и про вашу привычку «{{привычка}}» — у вас серия {{серия}} дней!\n\nКоманда HabitFlow",
    },
  ],
};

// ---------- Аудит: все действия админа логируются ----------

const audit: AuditEntry[] = [];

let auditId = 0;
const logAdmin = (admin: AuthUser, action: string, detail: string) => {
  const entry: AuditEntry = {
    id: `log_${++auditId}`,
    at: new Date().toISOString(),
    admin: admin.email,
    action,
    detail,
  };
  audit.unshift(entry);
  if (audit.length > 500) audit.length = 500;
};

// Seed исходных записей аудита
for (const u of [users[0], users[3], users[7]]) {
  audit.unshift({
    id: `log_seed_${auditId++}`,
    at: iso(new Date(Date.now() - Math.floor(rand() * 5) * DAY)),
    admin: "admin@habitflow.app",
    action: pick(["Регистрация", "Оплата тарифа", "Создание привычки"]),
    detail: `${u.name} (${u.email})`,
  });
}

// ---------- Безопасность ----------

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AuthUser;
    }
  }
}

/** Доступ только для администратора */
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Не авторизован" });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Доступ только для администратора" });
    return;
  }
  req.admin = user;
  next();
};

// ---------- Rate limiting на чувствительные операции ----------

// Максимум 5 удалений аккаунтов в минуту с одного IP
const DELETE_MAX = 5;
const DELETE_WINDOW_MS = 60_000;
const deleteHits = new Map<string, number[]>();

const allowDelete = (ip: string): boolean => {
  const now = Date.now();
  const hits = (deleteHits.get(ip) ?? []).filter((t) => now - t < DELETE_WINDOW_MS);
  if (hits.length >= DELETE_MAX) {
    deleteHits.set(ip, hits);
    return false;
  }
  hits.push(now);
  deleteHits.set(ip, hits);
  return true;
};

// ---------- Вспомогательные функции ----------

const paged = <T,>(items: T[], page: number, limit: number) => {
  const pages = Math.max(1, Math.ceil(items.length / limit));
  const p = Math.min(Math.max(1, page), pages);
  return { items: items.slice((p - 1) * limit, p * limit), total: items.length, page: p, pages, limit };
};

const isPlan = (v: unknown): v is AdminUser["plan"] => v === "free" || v === "pro" || v === "premium";

const MONTHS_RU = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

// ---------- Роутер ----------

const router = Router();
router.use("/", requireAdmin);

// ---- Дашборд: статистика ----

router.get("/stats", (_req, res) => {
  const now = new Date();
  const totalUsers = users.length;
  const registeredLast30 = users.filter((u) => Date.now() - new Date(u.registeredAt).getTime() < 30 * DAY).length;
  const activeToday = users.filter((u) => Date.now() - new Date(u.lastActive).getTime() < 24 * 3600 * 1000).length;

  const paid = users.filter((u) => u.plan !== "free");
  const pro = users.filter((u) => u.plan === "pro").length;
  const premium = users.filter((u) => u.plan === "premium").length;
  const free = users.length - pro - premium;
  const mrr =
    settings.prices.proMonthly * pro + Math.round((settings.prices.premiumYearly * premium) / 12);
  const conversion = Math.round(((pro + premium) / Math.max(1, totalUsers)) * 1000) / 10;

  // Регистрации за последние 30 дней
  const registrations30: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = day(d);
    registrations30.push({
      date: key,
      count: users.filter((u) => day(new Date(u.registeredAt)) === key).length,
    });
  }

  // Распределение по тарифам
  const planDonut = [
    { plan: "free", count: free },
    { plan: "pro", count: pro },
    { plan: "premium", count: premium },
  ];

  // Оплаты за последние 12 месяцев
  const payments12: { month: string; total: number; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const inMonth = payments.filter((p) => {
      const t = new Date(p.date).getTime();
      return p.status === "paid" && t >= d.getTime() && t < next.getTime();
    });
    payments12.push({
      month: `${MONTHS_RU[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      total: inMonth.reduce((s, p) => s + p.amount, 0),
      count: inMonth.length,
    });
  }

  res.json({
    totalUsers,
    usersGrowth: Math.round((registeredLast30 / Math.max(1, totalUsers - registeredLast30)) * 100),
    activeToday,
    mrr,
    mrrGrowth: 8,
    conversion,
    registrations30,
    planDonut,
    payments12,
    recentActions: audit.slice(0, 12),
  });
});

// ---- Пользователи ----

router.get("/users", (req, res) => {
  const q = String(req.query.search ?? "").trim().toLowerCase();
  const plan = String(req.query.plan ?? "all");
  const active = String(req.query.active ?? "all"); // all | active | blocked
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  let items = users;
  if (q) {
    items = items.filter(
      (u) => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }
  if (plan !== "all") items = items.filter((u) => u.plan === plan);
  if (active === "active") items = items.filter((u) => !u.blocked);
  if (active === "blocked") items = items.filter((u) => u.blocked);

  res.json(paged(items, page, limit));
});

router.get("/users/:id", (req, res) => {
  const u = users.find((x) => x.id === req.params.id);
  if (!u) {
    res.status(404).json({ error: "Пользователь не найден" });
    return;
  }
  res.json(u);
});

router.put("/users/:id/plan", (req, res) => {
  const u = users.find((x) => x.id === req.params.id);
  if (!u) return void res.status(404).json({ error: "Пользователь не найден" });
  const plan = req.body?.plan;
  if (!isPlan(plan)) return void res.status(400).json({ error: "Укажите тариф: free / pro / premium" });
  const prev = u.plan;
  u.plan = plan;
  logAdmin(req.admin!, `Смена тарифа`, `${u.email}: ${prev} → ${plan}`);
  // Уведомляем реального пользователя письмом (если учётная запись существует)
  try {
    const real = getAuthUserById(u.id);
    if (real) {
      sendEmail({
        to: real.email,
        templateId: "tariff_change",
        variables: { имя: real.name, тариф: planToName(plan) },
      });
    }
  } catch {
    /* без почты — не критично */
  }
  res.json(u);
});

router.post("/users/:id/block", (req, res) => {
  const u = users.find((x) => x.id === req.params.id);
  if (!u) return void res.status(404).json({ error: "Пользователь не найден" });
  u.blocked = true;
  logAdmin(req.admin!, "Блокировка", u.email);
  res.json(u);
});

router.post("/users/:id/unblock", (req, res) => {
  const u = users.find((x) => x.id === req.params.id);
  if (!u) return void res.status(404).json({ error: "Пользователь не найден" });
  u.blocked = false;
  logAdmin(req.admin!, "Разблокировка", u.email);
  res.json(u);
});

router.delete("/users/:id", (req, res) => {
  if (!allowDelete(req.ip ?? "?")) {
    return void res.status(429).json({
      error: "Слишком много удалений. Подождите минуту (лимит 5 в минуту).",
    });
  }
  const idx = users.findIndex((x) => x.id === req.params.id);
  if (idx === -1) return void res.status(404).json({ error: "Пользователь не найден" });
  const [removed] = users.splice(idx, 1);
  logAdmin(req.admin!, "Удаление аккаунта", removed.email);
  res.json({ ok: true });
});

// ---- Платежи ----

router.get("/payments", (req, res) => {
  const status = String(req.query.status ?? "all"); // all | paid | failed | refunded
  const from = String(req.query.from ?? "");
  const to = String(req.query.to ?? "");
  const exportAll = req.query.export === "1";
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  let items = payments;
  if (status !== "all") items = items.filter((p) => p.status === status);
  if (from) items = items.filter((p) => p.date >= from);
  if (to) items = items.filter((p) => p.date <= to);

  if (exportAll) {
    const rows = [
      ["Дата", "Пользователь", "Сумма", "Тариф", "Статус", "Чек"],
      ...items.map((p) => [
        day(new Date(p.date)),
        p.userName,
        String(p.amount),
        p.plan,
        p.status,
        p.receiptId,
      ]),
    ];
    res
      .type("text/csv; charset=utf-8")
      .set("Content-Disposition", 'attachment; filename="payments.csv"')
      .send(`\uFEFF${rows.map((r) => r.join(";")).join("\r\n")}`);
    return;
  }

  res.json(paged(items, page, limit));
});

// ---- Контент: мотивационные фразы ----

router.get("/content/motivations", (_req, res) => {
  res.json(motivations);
});

router.post("/content/motivations", (req, res) => {
  const text = String(req.body?.text ?? "").trim();
  const emoji = String(req.body?.emoji ?? "🌟").trim();
  if (text.length < 3) return void res.status(400).json({ error: "Текст фразы слишком короткий" });
  const m: Motivation = { id: `m${Date.now()}`, text, emoji };
  motivations.unshift(m);
  logAdmin(req.admin!, "Добавление фразы", text);
  res.status(201).json(m);
});

router.put("/content/motivations/:id", (req, res) => {
  const m = motivations.find((x) => x.id === req.params.id);
  if (!m) return void res.status(404).json({ error: "Фраза не найдена" });
  m.text = String(req.body?.text ?? m.text).trim() || m.text;
  m.emoji = String(req.body?.emoji ?? m.emoji).trim() || m.emoji;
  logAdmin(req.admin!, "Редактирование фразы", m.text);
  res.json(m);
});

router.delete("/content/motivations/:id", (req, res) => {
  const before = motivations.length;
  motivations = motivations.filter((x) => x.id !== req.params.id);
  if (motivations.length === before) return void res.status(404).json({ error: "Фраза не найдена" });
  logAdmin(req.admin!, "Удаление фразы", req.params.id);
  res.json({ ok: true });
});

// ---- Контент: FAQ (с изменением порядка) ----

router.get("/content/faq", (_req, res) => {
  res.json(contentFaq);
});

router.post("/content/faq", (req, res) => {
  const question = String(req.body?.question ?? "").trim();
  const answer = String(req.body?.answer ?? "").trim();
  if (question.length < 5 || answer.length < 5)
    return void res.status(400).json({ error: "Заполните вопрос и ответ" });
  const f: ContentFaq = { id: `f${Date.now()}`, question, answer };
  contentFaq.push(f);
  logAdmin(req.admin!, "Добавление вопроса FAQ", question);
  res.status(201).json(f);
});

router.put("/content/faq/:id", (req, res) => {
  const f = contentFaq.find((x) => x.id === req.params.id);
  if (!f) return void res.status(404).json({ error: "Вопрос не найден" });
  f.question = String(req.body?.question ?? f.question).trim() || f.question;
  f.answer = String(req.body?.answer ?? f.answer).trim() || f.answer;
  logAdmin(req.admin!, "Редактирование FAQ", f.question);
  res.json(f);
});

router.delete("/content/faq/:id", (req, res) => {
  const before = contentFaq.length;
  contentFaq = contentFaq.filter((x) => x.id !== req.params.id);
  if (contentFaq.length === before) return void res.status(404).json({ error: "Вопрос не найден" });
  logAdmin(req.admin!, "Удаление FAQ", req.params.id);
  res.json({ ok: true });
});

/** Drag-and-drop порядок FAQ: приходит массив id в нужном порядке */
router.put("/content/faq/order", (req, res) => {
  const ids: unknown = req.body?.ids;
  if (!Array.isArray(ids)) return void res.status(400).json({ error: "Ожидается массив ids" });
  const byId = new Map(contentFaq.map((f) => [f.id, f]));
  const next = (ids as string[])
    .map((id) => byId.get(id))
    .filter((f): f is ContentFaq => Boolean(f));
  const rest = contentFaq.filter((f) => !new Set(ids as string[]).has(f.id));
  contentFaq = [...next, ...rest];
  logAdmin(req.admin!, "Изменение порядка FAQ", `сохранён новый порядок` );
  res.json(contentFaq);
});

// ---- Контент: бонусы партнёров (Premium) ----

router.get("/content/bonuses", (_req, res) => {
  res.json(bonuses);
});

router.post("/content/bonuses", (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  if (name.length < 2) return void res.status(400).json({ error: "Укажите название бонуса" });
  const b: PartnerBonus = {
    id: `b${Date.now()}`,
    name,
    description: String(req.body?.description ?? "").trim(),
    link: String(req.body?.link ?? "").trim(),
    promoCode: String(req.body?.promoCode ?? "").trim(),
    expiresAt: String(req.body?.expiresAt ?? new Date(Date.now() + 90 * DAY).toISOString().slice(0, 10)),
  };
  bonuses.unshift(b);
  logAdmin(req.admin!, "Добавление бонуса", name);
  res.status(201).json(b);
});

router.put("/content/bonuses/:id", (req, res) => {
  const b = bonuses.find((x) => x.id === req.params.id);
  if (!b) return void res.status(404).json({ error: "Бонус не найден" });
  b.name = String(req.body?.name ?? b.name).trim() || b.name;
  b.description = String(req.body?.description ?? b.description).trim();
  b.link = String(req.body?.link ?? b.link).trim();
  b.promoCode = String(req.body?.promoCode ?? b.promoCode).trim();
  b.expiresAt = String(req.body?.expiresAt ?? b.expiresAt);
  logAdmin(req.admin!, "Редактирование бонуса", b.name);
  res.json(b);
});

router.delete("/content/bonuses/:id", (req, res) => {
  const before = bonuses.length;
  bonuses = bonuses.filter((x) => x.id !== req.params.id);
  if (bonuses.length === before) return void res.status(404).json({ error: "Бонус не найден" });
  logAdmin(req.admin!, "Удаление бонуса", req.params.id);
  res.json({ ok: true });
});

// ---- Настройки ----

router.get("/settings", (_req, res) => {
  res.json(settings);
});

router.put("/settings", (req, res) => {
  const body = req.body ?? {};
  const prices = {
    proMonthly: Number(body.prices?.proMonthly) || settings.prices.proMonthly,
    proYearly: Number(body.prices?.proYearly) || settings.prices.proYearly,
    premiumMonthly: Number(body.prices?.premiumMonthly) || settings.prices.premiumMonthly,
    premiumYearly: Number(body.prices?.premiumYearly) || settings.prices.premiumYearly,
  };
  settings = {
    prices,
    adsForFree: Boolean(body.adsForFree ?? settings.adsForFree),
    privacyText: String(body.privacyText ?? settings.privacyText),
    offerText: String(body.offerText ?? settings.offerText),
    emailTemplates: Array.isArray(body.emailTemplates)
      ? body.emailTemplates
      : settings.emailTemplates,
  };
  logAdmin(req.admin!, "Обновление настроек", "изменены цены/тексты");
  res.json(settings);
});

/** Список действий аудита */
router.get("/audit", (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  res.json(audit.slice(0, limit));
});

export default router;