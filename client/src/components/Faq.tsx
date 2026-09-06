import { useEffect, useState } from "react";
import { fetchJson } from "../lib/api";
import { FALLBACK_FAQ } from "../data/fallback";
import type { FaqItem } from "../lib/types";
import Accordion from "./ui/Accordion";
import Reveal from "./ui/Reveal";

/**
 * Секция FAQ: аккордеон с вопросами.
 * Вопросы подгружаются с API, при недоступности — фолбэк-данные.
 */
export default function Faq() {
  const [items, setItems] = useState<FaqItem[]>(FALLBACK_FAQ);

  useEffect(() => {
    let active = true;
    fetchJson<FaqItem[]>("/api/faq", FALLBACK_FAQ).then((data) => {
      if (active) setItems(data);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="faq" className="scroll-mt-20 bg-white py-20" aria-label="Частые вопросы">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="text-sm font-bold tracking-wide text-primary uppercase">FAQ</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">
            Частые вопросы
          </h2>
        </Reveal>

        <Reveal delay={120} className="mt-12">
          <Accordion items={items} />
        </Reveal>
      </div>
    </section>
  );
}