import { useEffect, useState } from "react";
import { fetchJson } from "../../lib/api";
import { FALLBACK_PRICING_FAQ } from "../../data/fallback";
import type { FaqItem } from "../../lib/types";
import Accordion from "../ui/Accordion";

/**
 * FAQ страницы тарифов: подгружается с /api/pricing/faq,
 * при недоступности API — фолбэк-данные.
 */
export default function PricingFaq() {
  const [items, setItems] = useState<FaqItem[]>(FALLBACK_PRICING_FAQ);

  useEffect(() => {
    let active = true;
    fetchJson<FaqItem[]>("/api/pricing/faq", FALLBACK_PRICING_FAQ).then((data) => {
      if (active) setItems(data);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto mt-16 max-w-3xl">
      <h2 className="text-center font-display text-2xl font-black tracking-tight text-ink sm:text-3xl">
        Вопросы про тарифы и оплату
      </h2>
      <div className="mt-8">
        <Accordion items={items} />
      </div>
    </div>
  );
}