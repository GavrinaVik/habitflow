import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchJson } from "../../lib/api";
import { FALLBACK_PLANS } from "../../data/fallback";
import type { PricingPlan } from "../../lib/types";
import {
  getBillingPeriod,
  setBillingPeriod,
  type BillingPeriod,
} from "../../lib/auth";
import Badge from "../ui/Badge";
import PricingCard from "../ui/PricingCard";
import Reveal from "../ui/Reveal";
import ComparisonTable from "./ComparisonTable";
import PricingFaq from "./PricingFaq";

/**
 * Основная секция тарифов:
 * переключатель «Месяц / Год» (с сохранением выбора в localStorage),
 * три карточки, таблица сравнения и FAQ.
 *
 * Логика CTA: всегда ведёт на страницу оплаты ?plan=&period= —
 * если сессии нет, CheckoutPage сама отправит на вход и вернёт обратно.
 * Бесплатный тариф открывает регистрацию.
 */
export default function PricingSection() {
  const [plans, setPlans] = useState<PricingPlan[]>(FALLBACK_PLANS);
  const [period, setPeriod] = useState<BillingPeriod>(getBillingPeriod);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    fetchJson<PricingPlan[]>("/api/pricing", FALLBACK_PLANS).then((data) => {
      if (active) setPlans(data);
    });
    return () => {
      active = false;
    };
  }, []);

  const choosePeriod = (next: BillingPeriod) => {
    setPeriod(next);
    setBillingPeriod(next); // сохраняем выбор в localStorage
  };

  const handleCta = (plan: PricingPlan) => {
    const params = `plan=${plan.id}&period=${period}`;
    navigate(plan.id === "free" ? `/register?${params}` : `/checkout?${params}`);
  };

  return (
    <section id="pricing" className="py-20" aria-label="Тарифы">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Переключатель периода оплаты */}
        <Reveal className="flex justify-center">
          <div
            className="relative inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white p-1.5 shadow-soft"
            role="group"
            aria-label="Период оплаты"
          >
            {/* Анимированный «ползунок» активного таба */}
            <span
              aria-hidden="true"
              className={`absolute top-1.5 bottom-1.5 w-[88px] rounded-full bg-primary shadow-soft transition-transform duration-300 ease-out ${
                period === "year" ? "translate-x-[96px]" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              onClick={() => choosePeriod("month")}
              aria-pressed={period === "month"}
              className={`relative z-10 w-[88px] rounded-full py-2 text-sm font-bold transition-colors duration-300 ${
                period === "month" ? "text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              Месяц
            </button>
            <button
              type="button"
              onClick={() => choosePeriod("year")}
              aria-pressed={period === "year"}
              className={`relative z-10 w-[88px] rounded-full py-2 text-sm font-bold transition-colors duration-300 ${
                period === "year" ? "text-white" : "text-ink-soft hover:text-ink"
              }`}
            >
              Год
            </button>
            {/* Бейдж экономии появляется при выборе года */}
            <span
              className={`overflow-hidden transition-all duration-300 ${
                period === "year" ? "max-w-32 opacity-100" : "max-w-0 opacity-0"
              }`}
            >
              <Badge variant="accent">Экономия 17%</Badge>
            </span>
          </div>
        </Reveal>

        {/* Карточки тарифов */}
        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 120} className="h-full">
              <PricingCard plan={plan} period={period} onCta={handleCta} />
            </Reveal>
          ))}
        </div>

        {/* Таблица сравнения тарифов */}
        <Reveal delay={120} className="mt-16">
          <h2 className="text-center font-display text-2xl font-black tracking-tight text-ink sm:text-3xl">
            Сравните тарифы
          </h2>
          <div className="mt-8">
            <ComparisonTable />
          </div>
        </Reveal>

        {/* FAQ по тарифам */}
        <PricingFaq />

        <Reveal delay={120}>
          <p className="mt-12 text-center text-sm text-ink-faint">
            Оплата через защищённый шлюз ЮKassa · Отмена в один клик · Без скрытых комиссий
          </p>
        </Reveal>
      </div>
    </section>
  );
}