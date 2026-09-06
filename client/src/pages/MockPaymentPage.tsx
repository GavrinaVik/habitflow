import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useAuth } from "../lib/auth";
import {
  getPaymentStatus,
  sendPaymentsWebhook,
} from "../lib/integrations";
import { reachGoal } from "../lib/metrica";
import { usePageMeta } from "../lib/seo";

const planLabel: Record<string, string> = { pro: "🚀 Pro", premium: "💎 Premium", free: "🌱 Free" };

/**
 * Мок-страница ЮKassa. В проде здесь был бы checkout на стороне банка;
 * отсюда ЮKassa присылает webhook payment.succeeded, а мы обновляем тариф.
 * В демо кнопка «Оплатить» вызывает тот же обработчик, что и webhook.
 */
export default function MockPaymentPage() {
  const { id } = useParams<{ id: string }>();
  usePageMeta("Оплата — ЮKassa", "Демо-страница оплаты ЮKassa.");
  const { refresh } = useAuth();
  const [status, setStatus] = useState<"pending" | "succeeded" | "canceled" | "loading">("loading");
  const [amount, setAmount] = useState(0);
  const [plan, setPlan] = useState("pro");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showWebhook, setShowWebhook] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPaymentStatus(id)
      .then((p) => {
        setStatus(p.status);
        setAmount(p.amount);
        setPlan(p.plan);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Не удалось загрузить платёж"))
      .finally(() => setStatus((s) => (s === "loading" ? "pending" : s)));
  }, [id]);

  const settle = async (result: "succeeded" | "canceled") => {
    if (!id) return;
    setBusy(true);
    setError("");
    try {
      // Живой путь: ЮKassa шлёт webhook-событие, мы обновляем тариф
      await sendPaymentsWebhook(id, result === "succeeded" ? "payment.succeeded" : "payment.canceled");
      await refresh();
      if (result === "succeeded") reachGoal("payment");
      setStatus(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка обработки платежа");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[75vh] py-16">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <Card className="p-8 text-center">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-black text-ink">ЮKassa</p>
            <Badge variant="primary">демо</Badge>
          </div>

          {status === "loading" || status === "pending" ? (
            <>
              <p className="mt-6 text-5xl" aria-hidden="true">💳</p>
              <h1 className="mt-3 font-display text-2xl font-black text-ink">
                {status === "loading" ? "Загружаем платёж…" : "Оплата заказа"}
              </h1>
              <p className="mt-2 text-sm text-ink-soft">
                Тариф {planLabel[plan] ?? plan} ·{" "}
                <b className="text-ink">{amount.toLocaleString("ru-RU")} ₽</b>
              </p>

              {error && (
                <p className="mt-4 rounded-card bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
              )}

              <div className="mt-6 grid gap-2">
                <Button
                  className="w-full"
                  loading={busy}
                  data-metrica="goal:mock-pay-success"
                  onClick={() => settle("succeeded")}
                >
                  Оплатить {amount.toLocaleString("ru-RU")} ₽
                </Button>
                <Button variant="outline" className="w-full" disabled={busy} onClick={() => settle("canceled")}>
                  Отменить
                </Button>
              </div>

              <button
                type="button"
                onClick={() => setShowWebhook((v) => !v)}
                className="mt-5 text-xs font-bold text-ink-faint hover:text-primary"
              >
                {showWebhook ? "Скрыть webhook-событие" : "Посмотреть webhook-событие ↗"}
              </button>
              {showWebhook && (
                <pre className="mt-3 overflow-x-auto rounded-card bg-ink p-3 text-left text-[10px] leading-relaxed text-emerald-300">
{`POST /api/payments/webhook
{
  "event": "payment.succeeded",
  "object": { "id": "${id}" }
}
→ тариф обновлён, чек отправлен на email`}
                </pre>
              )}
            </>
          ) : status === "succeeded" ? (
            <>
              <p className="mt-6 text-5xl" aria-hidden="true">🎉</p>
              <h1 className="mt-3 font-display text-2xl font-black text-ink">Оплата прошла!</h1>
              <p className="mt-2 text-sm text-ink-soft">
                Тариф <b className="text-primary">{planLabel[plan] ?? plan}</b> активирован.
                <br />
                Чек отправлен на email, подписка продлена.
              </p>
              <div className="mt-6 grid gap-2">
                <Link
                  to="/dashboard"
                  className="rounded-btn bg-primary px-5 py-2.5 text-center text-sm font-bold text-white shadow-soft transition-colors hover:bg-primary-dark"
                  data-metrica="goal:payment-go-dashboard"
                >
                  Перейти в кабинет
                </Link>
                <Link
                  to="/dashboard/settings"
                  className="rounded-btn border border-ink/10 px-5 py-2.5 text-center text-sm font-bold text-ink transition-colors hover:bg-canvas"
                >
                  В настройки
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-6 text-5xl" aria-hidden="true">😔</p>
              <h1 className="mt-3 font-display text-2xl font-black text-ink">Платёж отменён</h1>
              <p className="mt-2 text-sm text-ink-soft">Вы можете вернуться и выбрать другой тариф.</p>
              <div className="mt-6">
                <Link
                  to="/pricing"
                  className="inline-block rounded-btn bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-primary-dark"
                >
                  К тарифам
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}