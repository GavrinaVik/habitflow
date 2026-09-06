import { useState } from "react";

export interface AccordionItemData {
  id: number;
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItemData[];
}

/**
 * Аккордеон для FAQ: один открытый вопрос, плавное раскрытие ответа.
 */
export default function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<number | null>(items[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div
            key={item.id}
            className={`overflow-hidden rounded-card border bg-white shadow-soft transition-all duration-200 ${
              open ? "border-primary/40" : "border-ink/5"
            }`}
          >
            {/* Заголовок вопроса — кнопка целиком */}
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="font-display text-base font-extrabold text-ink">
                {item.question}
              </span>
              {/* Значок «+» поворачивается на 45° при открытии */}
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary-dark transition-transform duration-300 ${
                  open ? "rotate-45" : ""
                }`}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>

            {/* Ответ: плавно раскрывается через max-height */}
            <div
              className="overflow-hidden transition-[max-height] duration-300 ease-out"
              style={{ maxHeight: open ? "300px" : "0px" }}
            >
              <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}