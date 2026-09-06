import type { PricingPlan } from "../../lib/types";
import type { BillingPeriod } from "../../lib/auth";
import Badge from "./Badge";
import Button from "./Button";

interface PricingCardProps {
  plan: PricingPlan;
  period: BillingPeriod;
  onCta: (plan: PricingPlan) => void;
}

const formatPrice = (value: number): string =>
  value === 0 ? "0 ₽" : value.toLocaleString("ru-RU") + " ₽";

/**
 * Карточка тарифа: название, цена (месяц/год), функции и CTA.
 * Выделенный тариф (Pro): рамка 2px #8B5CF6, бейдж «Популярный»,
 * акцентная кнопка. При наведении карточка приподнимается на 4px.
 */
export default function PricingCard({ plan, period, onCta }: PricingCardProps) {
  // У Premium оплата только за год: в режиме «Месяц» цену не показываем
  const yearlyOnly = period === "month" && plan.monthlyPrice === null;
  const price = yearlyOnly ? null : period === "year" ? plan.yearlyPrice : plan.monthlyPrice;
  const perMonth = plan.yearlyPrice > 0 ? Math.round(plan.yearlyPrice / 12) : 0;

  return (
    <article
      className={
        plan.highlighted
          ? "relative flex h-full flex-col rounded-card border-2 border-violet-500 bg-white p-7 shadow-lift transition-all duration-300 hover:-translate-y-1 hover:shadow-lift lg:-my-3 lg:py-10"
          : "relative flex h-full flex-col rounded-card border border-ink/10 bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
      }
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="violet">⭐ Популярный</Badge>
        </span>
      )}

      {/* Название + эмодзи тарифа */}
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-canvas text-xl shadow-soft">
          {plan.emoji}
        </span>
        <h3 className="font-display text-xl font-extrabold">{plan.name}</h3>
      </div>

      {/* Цена: анимируется при переключении Месяц/Год */}
      <div key={period} className="animate-pop mt-6">
        <p className="font-display text-4xl font-black text-ink">
          {price === null ? "—" : formatPrice(price)}
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          {yearlyOnly
            ? "Только годовая подписка"
            : period === "year" && plan.yearlyPrice > 0
              ? `≈ ${perMonth} ₽/мес при оплате за год`
              : period === "year"
                ? "₽/год"
                : "₽/мес"}
        </p>
      </div>

      {/* Список функций: ✓ включено / ✗ нет */}
      <ul className="mt-6 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature.text} className="flex items-start gap-2.5 text-sm">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                feature.included
                  ? "bg-primary-soft text-primary-dark"
                  : "bg-ink/5 text-ink-faint"
              }`}
              aria-hidden="true"
            >
              {feature.included ? "✓" : "✗"}
            </span>
            <span
              className={
                feature.included
                  ? "text-ink-soft"
                  : "text-ink-faint line-through decoration-ink-faint/40"
              }
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA: у Pro акцентная кнопка, у остальных outline */}
      <Button
        type="button"
        variant={plan.highlighted ? "accent" : "outline"}
        className="mt-8 w-full"
        data-metrica={`goal:pricing-${plan.id}`}
        onClick={() => onCta(plan)}
      >
        {plan.ctaLabel}
      </Button>
    </article>
  );
}