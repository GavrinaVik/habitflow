import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useAuth } from "../lib/auth";
import {
  connectCalendar,
  disconnectCalendar,
  getCalendarStatus,
  syncHabitToCalendar,
} from "../lib/integrations";
import { unsubscribeNewsletter } from "../lib/integrations";
import { postJson } from "../lib/api";
import { reachGoal } from "../lib/metrica";
import type { CalendarStatus } from "../lib/types";

const planName = (p?: string) =>
  p === "premium" ? "Premium" : p === "pro" ? "Pro" : p === "free" ? "Free" : "—";

const planBadgeVariant = (p?: string): "default" | "primary" | "violet" =>
  p === "premium" ? "violet" : p === "pro" ? "primary" : "default";

const fmtExpiry = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ru-RU") : null;

/**
 * Настройки личного кабинета: профиль, подписка, рассылка
 * и интеграция Google Calendar (Premium).
 */
export default function SettingsPage() {
  const { user, loading, refresh } = useAuth();
  const [cal, setCal] = useState<CalendarStatus | null>(null);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [newsBusy, setNewsBusy] = useState(false);

  useEffect(() => {
    if (user) {
      getCalendarStatus().then(setCal).catch(() => setCal({ connected: false, premium: false }));
    }
  }, [user]);

  if (loading) {
    return (
      <main className="grid min-h-[60vh] place-items-center px-4">
        <p className="animate-pulse font-display text-lg font-bold text-ink-soft">Загрузка…</p>
      </main>
    );
  }
  if (!user) return <Navigate to="/login?next=/dashboard/settings" replace />;

  const toggleNewsletter = async (next: boolean) => {
    setNewsBusy(true);
    setNote("");
    try {
      if (!next) await unsubscribeNewsletter(user.email);
      else await postJson("/api/auth/subscribe", { subscribed: true });
      await refresh();
      setNote(next ? "Вы подписаны на дайджест и серию писем." : "Вы отписаны от рассылки.");
      reachGoal(next ? "newsletter-subscribe" : "newsletter-unsubscribe");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Не удалось изменить подписку");
    } finally {
      setNewsBusy(false);
    }
  };

  const handleConnect = async () => {
    setBusy("connect");
    setNote("");
    try {
      const res = await connectCalendar();
      window.location.href = "/mock-oauth/google";
      void res;
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Не удалось начать подключение");
      setBusy("");
    }
  };

  const handleSync = async () => {
    setBusy("sync");
    setNote("");
    try {
      const info = await syncHabitToCalendar("all").catch(() => ({ synced: false, events: [] }));
      if (info.synced) {
        setNote(`Синхронизировано ${info.events.length} событий.`);
        reachGoal("calendar-sync");
      }
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Не удалось синхронизировать");
    } finally {
      setBusy("");
    }
  };

  const handleDisconnect = async () => {
    setBusy("disconnect");
    setNote("");
    try {
      await disconnectCalendar();
      setCal({ connected: false, premium: user.plan === "premium" });
      reachGoal("calendar-disconnect");
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Не удалось отключить календарь");
    } finally {
      setBusy("");
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-black tracking-tight text-ink">Настройки</h1>
      <p className="mt-1 text-sm text-ink-soft">Профиль, подписка, рассылка и интеграции.</p>

      {note && (
        <p className="mt-4 rounded-card bg-primary-soft px-4 py-3 text-sm font-medium text-primary-deep">{note}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <p className="font-display text-lg font-extrabold text-ink">👤 Профиль</p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-ink-soft">Имя</dt>
              <dd className="font-bold text-ink">{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-ink-soft">Email</dt>
              <dd className="truncate font-bold text-ink">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-ink-soft">Вход через</dt>
              <dd className="font-bold text-ink capitalize">{user.provider ?? "пароль"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-ink-soft">Email подтверждён</dt>
              <dd className="font-bold text-emerald-500">{user.emailConfirmed ? "Да" : "Нет"}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-lg font-extrabold text-ink">💳 Подписка</p>
            <Badge variant={planBadgeVariant(user.plan)}>{planName(user.plan)}</Badge>
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            {user.plan === "free"
              ? "Быстрый бесплатный старт: до 3 привычек и базовый график."
              : fmtExpiry(user.planExpiresAt)
                ? `Тариф действует до ${fmtExpiry(user.planExpiresAt)}.`
                : "Тариф активирован."}
          </p>
          <Button to="/pricing" variant="outline" className="mt-4" data-metrica="goal:settings-pricing">
            {user.plan === "free" ? "Выбрать тариф" : "Изменить тариф"}
          </Button>
        </Card>

        <Card className="p-6">
          <p className="font-display text-lg font-extrabold text-ink">🔔 Email-рассылки</p>
          <p className="mt-2 text-sm text-ink-soft">
            {user.subscribed
              ? "Подписаны: еженедельный дайджест прогресса и серия «Как не бросить привычку»."
              : "Отписаны: писем, кроме служебных, не приходит."}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            loading={newsBusy}
            onClick={() => toggleNewsletter(!user.subscribed)}
            data-metrica="goal:newsletter-toggle"
          >
            {user.subscribed ? "Отписаться" : "Подписаться"}
          </Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-lg font-extrabold text-ink">📅 Google Calendar</p>
            <Badge variant={cal?.connected ? "primary" : "default"}>
              {cal?.connected ? "подключён" : user.plan === "premium" ? "Premium" : "Pro+"}
            </Badge>
          </div>
          {user.plan !== "premium" ? (
            <p className="mt-3 text-sm text-ink-soft">
              Синхронизация привычек с Google Calendar доступна на тарифе{" "}
              <b className="text-ink">Premium</b>.
            </p>
          ) : cal?.connected ? (
            <>
              <p className="mt-3 text-sm text-ink-soft">
                События привычек создаются в вашем календаре автоматически.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" className="text-xs" loading={busy === "sync"} onClick={handleSync}>
                  Синхронизировать
                </Button>
                <Button
                  variant="outline"
                  className="text-xs text-red-500"
                  loading={busy === "disconnect"}
                  onClick={handleDisconnect}
                >
                  Отключить
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-ink-soft">
                Подключите аккаунт Google, чтобы события привычек попадали в календарь.
              </p>
              <Button className="mt-4" loading={busy === "connect"} onClick={handleConnect} data-metrica="goal:calendar-connect">
                Подключить Google Calendar
              </Button>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}