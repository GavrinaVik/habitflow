export interface AuthUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  role?: "user" | "admin";
  provider?: string;
  emailConfirmed?: boolean;
  planExpiresAt?: string | null;
  subscribed?: boolean;
}

export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  emoji: string;
  monthlyPrice: number | null;
  yearlyPrice: number;
  ctaLabel: string;
  highlighted: boolean;
  features: PricingFeature[];
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export interface Checkin {
  date: string;
  done: boolean;
  value: number;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  target: number;
  unit: string;
  streak: number;
  color: string;
  /** Регулярность: "daily" | "every-other" | "3x" | "5x" */
  frequency: string;
  /** Время напоминания "HH:MM" или null (без напоминания) */
  reminderTime: string | null;
  history: Checkin[];
}

/** Поля для создания/редактирования привычки */
export interface HabitInput {
  name: string;
  emoji: string;
  target: number;
  unit: string;
  color: string;
}

/** Частичное обновление привычки (настройки) */
export type HabitPatch = Partial<
  Pick<Habit, "name" | "emoji" | "target" | "unit" | "color" | "frequency" | "reminderTime">
>;

/** Точка графика прогресса: дата, план, факт и процент */
export interface HabitDay {
  date: string;
  plan: number;
  fact: number;
  percent: number;
}

/** Период графика */
export type HabitPeriod = "week" | "month" | "all";

/** Ответ /api/habits/:id/history */
export interface HabitHistoryPage {
  items: Checkin[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

/** Агрегированная статистика за выбранный период */
export interface PeriodStats {
  /** Средний процент выполнения */
  avg: number;
  bestDate: string;
  bestPercent: number;
  worstDate: string;
  worstPercent: number;
  /** Текущая серия полностью выполненных дней */
  streak: number;
  done: number;
  total: number;
}

// ===================== Админ-панель =====================

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

export interface AdminUserAction {
  at: string;
  action: string;
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
  prices: {
    proMonthly: number;
    proYearly: number;
    premiumMonthly: number;
    premiumYearly: number;
  };
  adsForFree: boolean;
  privacyText: string;
  offerText: string;
  emailTemplates: EmailTemplate[];
}

export interface AdminStats {
  totalUsers: number;
  usersGrowth: number;
  activeToday: number;
  mrr: number;
  mrrGrowth: number;
  conversion: number;
  registrations30: { date: string; count: number }[];
  planDonut: { plan: string; count: number }[];
  payments12: { month: string; total: number; count: number }[];
  recentActions: AuditEntry[];
}

/** Универсальный ответ со списком и пагинацией */
export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface HabitStats {
  habitId: string;
  total: number;
  doneCount: number;
  completionRate: number;
  totalValue: number;
  currentStreak: number;
  bestStreak: number;
  last7: number[];
}

// ===================== Интеграции =====================

export type BillingPeriod = "month" | "year";

/** Ответ создания платежа в ЮKassa (мок) */
export interface CreatedPayment {
  payment_id: string;
  payment_url: string;
  amount: number;
}

/** Статус платежа */
export interface PaymentStatus {
  payment_id: string;
  status: "pending" | "succeeded" | "canceled";
  amount: number;
  plan: string;
  period: BillingPeriod;
}

/** Статус подключения Google Calendar */
export interface CalendarStatus {
  connected: boolean;
  premium: boolean;
}

/** Событие календаря (мок) */
export interface CalendarEvent {
  singleId: string;
  exid: string;
  habitId: string;
  title: string;
  start: string;
  until: string;
  frequency: string;
}

/** Результат публикации в соцсети */
export interface SharePostResult {
  post_id: string;
  social: "instagram" | "vk";
  status: "queued" | "published";
  post_url?: string;
  url?: string;
}

/** Отправленное письмо (лог) */
export interface SentEmail {
  id: string;
  to: string;
  templateId: string;
  subject: string;
  body: string;
  at: string;
}