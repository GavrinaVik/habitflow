import { postJson, requestJson } from "./api";
import type {
  BillingPeriod,
  CalendarEvent,
  CalendarStatus,
  CreatedPayment,
  PaymentStatus,
  SharePostResult,
} from "./types";

/**
 * Клиент интеграций: ЮKassa, Unisender, Google Calendar, соцсети.
 * Все запросы идут через тот же httpOnly-cookie, что и остальное API.
 */

// ---------- ЮKassa ----------

export function createPayment(plan: string, period: BillingPeriod): Promise<CreatedPayment> {
  return postJson<CreatedPayment>("/api/payments/create", { plan, period });
}

export function getPaymentStatus(id: string): Promise<PaymentStatus> {
  return requestJson<PaymentStatus>(`/api/payments/${id}`);
}

/** Отправить webhook вручную (для демонстрации реального пути ЮKassa) */
export function sendPaymentsWebhook(paymentId: string, event: "payment.succeeded" | "payment.canceled") {
  return postJson<{ ok: boolean }>("/api/payments/webhook", {
    event,
    object: { id: paymentId },
  });
}

// ---------- Unisender ----------

export function unsubscribeNewsletter(email: string): Promise<{ ok: boolean }> {
  return postJson<{ ok: boolean }>("/api/email/unsubscribe", { email });
}

// ---------- Google Calendar ----------

export function getCalendarStatus(): Promise<CalendarStatus> {
  return requestJson<CalendarStatus>("/api/calendar/status");
}

/** Начать OAuth-подключение Google Calendar */
export function connectCalendar(): Promise<{ auth_url: string; need_authorization: boolean }> {
  return postJson<{ auth_url: string; need_authorization: boolean }>("/api/calendar/connect", {});
}

/** Завершить OAuth (мок-редирект от «Google») */
export function calendarCallback(): Promise<{ connected: boolean }> {
  return postJson<{ connected: boolean }>("/api/calendar/callback", {});
}

export function disconnectCalendar(): Promise<{ connected: boolean }> {
  return postJson<{ connected: boolean }>("/api/calendar/disconnect", {});
}

export function syncHabitToCalendar(habitId?: string): Promise<{ synced: boolean; events: CalendarEvent[] }> {
  return postJson<{ synced: boolean; events: CalendarEvent[] }>("/api/calendar/sync", { habit_id: habitId ?? "all" });
}

// ---------- Соцсети ----------

export function shareInstagram(caption: string, dataUrl: string): Promise<SharePostResult> {
  return postJson<SharePostResult>("/api/share/instagram", { caption, image_url: dataUrl });
}

export function shareVk(text: string, imageUrl: string): Promise<SharePostResult> {
  return postJson<SharePostResult>("/api/share/vk", { text, image_url: imageUrl });
}