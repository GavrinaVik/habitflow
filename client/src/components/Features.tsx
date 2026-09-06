import Card from "./ui/Card";
import Reveal from "./ui/Reveal";
import Badge from "./ui/Badge";

const features = [
  {
    emoji: "🎯",
    title: "Визуальный прогресс",
    text: "Интерактивные графики и прогресс-бары показывают динамику в реальном времени — мотивация каждый раз, когда заглядываешь в приложение.",
    color: "bg-primary-mist",
  },
  {
    emoji: "💬",
    title: "Мотивация каждый день",
    text: "Поддерживающие фразы подстраиваются под результат, а бейджи за серии превращают занятия в игру без выгорания.",
    color: "bg-accent-soft",
  },
  {
    emoji: "📊",
    title: "Глубокая аналитика",
    text: "На тарифах Pro и Premium — тренды, проценты выполнения и прогнозы: видно, где вы сильны, а где нужна поддержка.",
    color: "bg-primary-mist",
  },
];

/**
 * Блок преимуществ продукта: три ключевые фичи.
 */
export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 bg-canvas py-20" aria-label="Преимущества">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-primary uppercase">Возможности</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">
            Почему HabitFlow работает
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Не очередной планировщик, а система, которая поддерживает вас каждый день.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 120} className="h-full">
              <Card hover className="h-full p-6">
                <div className="flex items-start justify-between">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-xl text-2xl ${feature.color}`}
                  >
                    {feature.emoji}
                  </span>
                  {i === 2 && <Badge variant="accent">Pro/Premium</Badge>}
                </div>
                <h3 className="mt-4 font-display text-lg font-extrabold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{feature.text}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}