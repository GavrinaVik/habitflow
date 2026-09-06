import { useRef, useState } from "react";

const TARGET = 50;
const CONFETTI_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444", "#ec4899"];

const phrases: { upTo: number; text: string }[] = [
  { upTo: 25, text: "Начинаем! Каждый повтор приближает цель 🌱" },
  { upTo: 50, text: "Красавчик, уже половина пути! 💪" },
  { upTo: 75, text: "Ещё немного — и цель ваша! 🔥" },
  { upTo: 99, text: "Финальный рывок, давай! 🚀" },
  { upTo: 100, text: "Цель достигнута! Сегодня вы супергерой 🏆" },
];

function phraseFor(percent: number): string {
  return phrases.find((p) => percent <= p.upTo)?.text ?? phrases[0].text;
}

export default function DemoHabitCard() {
  const [value, setValue] = useState(42);
  const [burst, setBurst] = useState(0);
  const prevPercent = useRef(84);

  const percent = Math.min(100, Math.round((value / TARGET) * 100));
  const quote = phraseFor(percent);

  const add = () => {
    const next = Math.min(TARGET, value + Math.ceil(Math.random() * 5));
    setValue(next);
    const p = Math.round((next / TARGET) * 100);
    if (prevPercent.current < 100 && p >= 100) {
      setBurst((b) => b + 1);
    }
    prevPercent.current = p;
  };

  const miss = () => {
    setValue(Math.floor(Math.random() * 30));
    prevPercent.current = 30;
  };

  return (
    <div className="relative mx-auto w-full max-w-sm rounded-card border border-ink/5 bg-white p-6 shadow-lift">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-2xl">
            💪
          </span>
          <div>
            <p className="font-display text-lg font-extrabold text-ink">Приседания</p>
            <p className="text-sm text-ink-soft">
              цель — {TARGET} приседаний/день
            </p>
          </div>
        </div>
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent-dark">
          🔥 {value >= TARGET ? 13 : 12} дней
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-3xl font-black text-ink">
            {value}
            <span className="text-base font-bold text-ink-faint"> / {TARGET}</span>
          </span>
          <span className="font-display text-xl font-black text-primary">{percent}%</span>
        </div>
        <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-canvas">
          <div
            className="habit-progress h-full rounded-full bg-gradient-to-r from-primary to-accent"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <p className="mt-4 min-h-5 text-sm font-medium text-ink-soft">{quote}</p>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={add}
          className="flex-1 rounded-btn bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-all duration-200 hover:bg-primary-dark"
        >
          ✅ Сделал
        </button>
        <button
          type="button"
          onClick={miss}
          className="flex-1 rounded-btn bg-canvas px-4 py-2.5 text-sm font-bold text-ink-soft transition-all duration-200 hover:bg-ink/5"
        >
          Не сделал
        </button>
      </div>

      {burst > 0 && (
        <>
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={`${burst}-${i}`}
              className="confetti-piece pointer-events-none absolute top-0 h-2.5 w-2.5 rounded-[2px]"
              style={{
                left: `${(i * 137) % 100}%`,
                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                animationDelay: `${(i % 8) * 0.05}s`,
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}