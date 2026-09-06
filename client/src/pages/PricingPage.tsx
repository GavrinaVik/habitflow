import { useEffect } from "react";
import PricingSection from "../components/pricing/PricingSection";
import { reachGoal } from "../lib/metrica";
import { usePageMeta } from "../lib/seo";

/**
 * Страница тарифов: шапка + секция тарифов (переключатель,
 * карточки, таблица сравнения, FAQ).
 */
export default function PricingPage() {
  usePageMeta("Тарифы", "Выберите свой ритм: Free, Pro и Premium. Меняйте или отменяйте тариф в любой момент.");
  useEffect(() => {
    reachGoal("pricing-view");
  }, []);

  return (
    <main>
      {/* Краткая шапка страницы на градиенте */}
      <section
        className="bg-gradient-to-br from-violet-500 to-primary pb-20 pt-16 text-center"
        aria-label="Заголовок тарифов"
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="text-sm font-bold tracking-wide text-white/70 uppercase">Тарифы</p>
          <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
            Выберите свой ритм
          </h1>
          <p className="mt-4 text-lg text-white/80">
            Начните бесплатно и растите вместе с привычками. Меняйте или отменяйте
            тариф в любой момент.
          </p>
        </div>
      </section>

      {/* Карточки слегка «наезжают» на градиентную шапку */}
      <div className="-mt-12">
        <PricingSection />
      </div>
    </main>
  );
}