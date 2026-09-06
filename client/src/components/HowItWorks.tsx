import Card from "./ui/Card";
import Reveal from "./ui/Reveal";

const steps = [
  {
    emoji: "🎯",
    title: "Создай привычку",
    text: "Укажи конкретную цель — например, 50 приседаний в день. Без абстрактных «стараться больше».",
  },
  {
    emoji: "📈",
    title: "Отслеживай прогресс",
    text: "Отмечай выполнение каждый день и смотри графики: неделя, месяц, динамика по каждой привычке.",
  },
  {
    emoji: "🏆",
    title: "Достигай целей",
    text: "Получай мотивационные фразы в нужный момент и бейджи за серии — игра, в которую хочется возвращаться.",
  },
];

/**
 * Блок «Как это работает»: три шага формирования привычки.
 */
export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 bg-white py-20" aria-label="Как это работает">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-primary uppercase">Как это работает</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">
            Три шага до новой привычки
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Никакой магии: конкретные цели, честный учёт и маленькие радости за прогресс.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 120}>
              <Card hover className="h-full p-6">
                <div className="grid h-13 w-13 place-items-center rounded-xl bg-canvas text-2xl shadow-soft">
                  {step.emoji}
                </div>
                <p className="mt-4 text-xs font-black tracking-wide text-ink-faint">
                  Шаг {i + 1}
                </p>
                <h3 className="mt-1 font-display text-lg font-extrabold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}