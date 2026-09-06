import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useAuth } from "../lib/auth";
import { FALLBACK_PLANS, FALLBACK_PRICING_FAQ } from "../data/fallback";
import Accordion from "../components/ui/Accordion";
import { createPayment } from "../lib/integrations";
import type { BillingPeriod } from "../lib/types";
import { usePageMeta } from "../lib/seo";

const planNames: Record<string, string> = {
  free: "🌱 Free",
  pro: "🚀 Pro",
  premium: "💎 Premium",
};

/**
 * Страница оплаты. Интеграция с ЮKassa:
 * клик «Оплатить» -> POST /api/payments/create -> получаем payment_url
 * и перенаправляем пользователя на страницу оплаты (в демо — /pay/:id,
 * которая имитирует ЮKassa и webhook payment.succeeded).
 */
export default function CheckoutPage() {
  usePageMeta("Оплата", "Оплата тарифа HabitFlow через ЮKassa.");
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4">
        <p className="animate-pulse font-display text-lg font-bold text-ink-soft">Загрузка…</p>
      </main>
    );
  }

  if (!user) {
    const returnTo = `/login?next=${encodeURIComponent(`/checkout?${searchParams.toString()}`)}`;
    return <Navigate to={returnTo} replace />;
  }

  const planId = searchParams.get("plan") ?? "pro";
  const period: BillingPeriod = searchParams.get("period") === "year" ? "year" : "month";
  const plan = FALLBACK_PLANS.find((p) => p.id === planId) ?? FALLBACK_PLANS[1];

  const yearlyOnly = period === "month" && plan.monthlyPrice === null;
  const price = yearlyOnly ? plan.yearlyPrice : period === "year" ? plan.yearlyPrice : plan.monthlyPrice ?? 0;

  const handlePay = async () => {
    setSubmitting(true);
    setError("");
    try {
      const { payment_url } = await createPayment(planId, period);
      window.location.href = payment_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать платёж");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[75vh] py-16">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <Card className="p-8">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl font-black tracking-tight text-ink">Оплата</h1>
            <Badge variant="primary">ЮKassa</Badge>
          </div>

          {/* Сводка заказа */}
          <div className="mt-6 rounded-card bg-canvas p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Тариф</span>
              <span className="text-sm font-bold text-ink">{planNames[plan.id]}</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Период</span>
              <span className="text-sm font-bold text-ink">
                {period === "year" ? "Год (экономия 17%)" : "Месяц"}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-ink/10 pt-2.5">
              <span className="text-sm font-semibold text-ink">Итого</span>
              <span className="font-display text-2xl font-black text-primary">
                {price.toLocaleString("ru-RU")} ₽
                <span className="ml-1 text-xs font-bold text-ink-soft">
                  {period === "year" ? "/год" : "/мес"}
                </span>
              </span>
            </div>
            {yearlyOnly && (
              <p className="mt-2 text-xs text-ink-faint">
                Тариф Premium доступен только с годовой оплатой.
              </p>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-card bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
          )}

          <Button
            type="button"
            variant={plan.highlighted ? "accent" : "primary"}
            className="mt-6 w-full"
            data-metrica="goal:checkout-pay"
            loading={submitting}
            onClick={handlePay}
          >
            Оплатить {price.toLocaleString("ru-RU")} ₽
          </Button>

          <p className="mt-3 text-center text-[11px] font-semibold text-ink-faint">
            После оплаты вы перейдёте на защищённую страницу ЮKassa (в демо — мок-страница).
          </p>
          <p className="mt-4 text-center text-xs text-ink-faint">
            Пользователь: {user.name} · {user.email}
          </p>
        </Card>

        {/* Мини-FAQ на случай вопросов перед оплатой */}
        <div className="mt-10">
          <h2 className="text-center font-display text-xl font-black tracking-tight text-ink">
            Перед оплатой
          </h2>
          <div className="mt-4">
            <Accordion items={FALLBACK_PRICING_FAQ.slice(0, 2)} />
          </div>
        </div>
      </div>
    </main>
  );
}