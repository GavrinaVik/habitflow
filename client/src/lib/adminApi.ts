import { requestJson } from "./api";
import type {
  AdminSettings,
  AdminStats,
  AdminUser,
  AuditEntry,
  ContentFaq,
  Motivation,
  Paged,
  PartnerBonus,
  Payment,
} from "./types";

const qs = (params: object): string => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") s.set(k, String(v));
  }
  const out = s.toString();
  return out ? `?${out}` : "";
};

/** Скачать CSV с сервера (payments export) */
function downloadCsv(url: string): Promise<void> {
  return fetch(url).then(async (res) => {
    if (!res.ok) throw new Error("Ошибка экспорта");
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "payments.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

// ---- Дашборд / аудит ----

export const getAdminStats = (): Promise<AdminStats> =>
  requestJson<AdminStats>("/api/admin/stats");

export const getAdminAudit = (limit = 30): Promise<AuditEntry[]> =>
  requestJson<AuditEntry[]>(`/api/admin/audit?limit=${limit}`);

// ---- Пользователи ----

export interface UsersParams {
  search?: string;
  plan?: string;
  active?: string;
  page?: number;
  limit?: number;
}

export const getAdminUsers = (p: UsersParams): Promise<Paged<AdminUser>> =>
  requestJson<Paged<AdminUser>>(`/api/admin/users${qs(p)}`);

export const getAdminUser = (id: string): Promise<AdminUser> =>
  requestJson<AdminUser>(`/api/admin/users/${id}`);

export const setAdminUserPlan = (id: string, plan: string): Promise<AdminUser> =>
  requestJson<AdminUser>(`/api/admin/users/${id}/plan`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });

export const setAdminUserBlocked = (id: string, blocked: boolean): Promise<AdminUser> =>
  requestJson<AdminUser>(`/api/admin/users/${id}/${blocked ? "block" : "unblock"}`, {
    method: "POST",
  });

export const deleteAdminUser = (id: string): Promise<{ ok: boolean }> =>
  requestJson<{ ok: boolean }>(`/api/admin/users/${id}`, { method: "DELETE" });

// ---- Платежи ----

export interface PaymentsParams {
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const getAdminPayments = (p: PaymentsParams): Promise<Paged<Payment>> =>
  requestJson<Paged<Payment>>(`/api/admin/payments${qs(p)}`);

export const exportAdminPayments = (p: PaymentsParams): Promise<void> =>
  downloadCsv(`/api/admin/payments${qs({ ...p, export: 1 })}`);

// ---- Контент ----

export const getMotivations = (): Promise<Motivation[]> =>
  requestJson<Motivation[]>("/api/admin/content/motivations");

export const createMotivation = (m: Pick<Motivation, "text" | "emoji">): Promise<Motivation> =>
  requestJson<Motivation>("/api/admin/content/motivations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(m),
  });

export const updateMotivation = (
  id: string,
  m: Pick<Motivation, "text" | "emoji">
): Promise<Motivation> =>
  requestJson<Motivation>(`/api/admin/content/motivations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(m),
  });

export const deleteMotivation = (id: string): Promise<{ ok: boolean }> =>
  requestJson<{ ok: boolean }>(`/api/admin/content/motivations/${id}`, { method: "DELETE" });

export const getFaq = (): Promise<ContentFaq[]> =>
  requestJson<ContentFaq[]>("/api/admin/content/faq");

export const createFaq = (f: Pick<ContentFaq, "question" | "answer">): Promise<ContentFaq> =>
  requestJson<ContentFaq>("/api/admin/content/faq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(f),
  });

export const updateFaq = (
  id: string,
  f: Pick<ContentFaq, "question" | "answer">
): Promise<ContentFaq> =>
  requestJson<ContentFaq>(`/api/admin/content/faq/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(f),
  });

export const deleteFaq = (id: string): Promise<{ ok: boolean }> =>
  requestJson<{ ok: boolean }>(`/api/admin/content/faq/${id}`, { method: "DELETE" });

export const reorderFaq = (ids: string[]): Promise<ContentFaq[]> =>
  requestJson<ContentFaq[]>(`/api/admin/content/faq/order`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });

export const getBonuses = (): Promise<PartnerBonus[]> =>
  requestJson<PartnerBonus[]>("/api/admin/content/bonuses");

export const createBonus = (b: Omit<PartnerBonus, "id">): Promise<PartnerBonus> =>
  requestJson<PartnerBonus>("/api/admin/content/bonuses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(b),
  });

export const updateBonus = (id: string, b: Omit<PartnerBonus, "id">): Promise<PartnerBonus> =>
  requestJson<PartnerBonus>(`/api/admin/content/bonuses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(b),
  });

export const deleteBonus = (id: string): Promise<{ ok: boolean }> =>
  requestJson<{ ok: boolean }>(`/api/admin/content/bonuses/${id}`, { method: "DELETE" });

// ---- Настройки ----

export const getAdminSettings = (): Promise<AdminSettings> =>
  requestJson<AdminSettings>("/api/admin/settings");

export const updateAdminSettings = (s: AdminSettings): Promise<AdminSettings> =>
  requestJson<AdminSettings>("/api/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(s),
  });