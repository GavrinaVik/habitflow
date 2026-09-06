import Button from "./ui/Button";
import Reveal from "./ui/Reveal";
import DemoHabitCard from "./DemoHabitCard";

/**
 * Hero-блок: заголовок, подзаголовок и CTA слева,
 * анимированное превью интерфейса справа.
 * Фон — диагональный градиент #10B981 → #3B82F6.
 */
export default function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#3B82F6]"
      aria-label="Главный экран"
    >
      {/* Декоративные размытые пятна для глубины фона */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-24">
        {/* Левая колонка — текст и кнопки */}
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur">
            🎉 Новые награды за серии уже здесь
          </span>

          <h1 className="mt-5 font-display text-4xl leading-tight font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Превращайте привычки в{" "}
            <span className="text-accent-soft">измеримый прогресс</span> 💪
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">
            Создавайте привычки, отслеживайте прогресс, достигайте целей — всё в
            одном месте.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button
              to="/pricing"
              size="lg"
              variant="light"
              data-metrica="goal:hero-start-free"
            >
              Начать бесплатно 🚀
            </Button>
            <Button to="/#how" size="lg" variant="glass" data-metrica="goal:hero-how">
              Как это работает
            </Button>
          </div>

          {/* Социальное доказательство */}
          <div className="mt-10 flex items-center gap-4">
            <div className="flex -space-x-2.5">
              {["🦊", "🐼", "🐸", "🦁"].map((avatar, i) => (
                <span
                  key={i}
                  className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/70 bg-white text-lg shadow-soft"
                >
                  {avatar}
                </span>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-white">12 400+ пользователей</p>
              <p className="text-xs text-white/70">закрыли свои цели в этом месяце</p>
            </div>
          </div>
        </Reveal>

        {/* Правая колонка — анимированное превью интерфейса */}
        <Reveal delay={150} direction="right" className="lg:justify-self-end">
          <DemoHabitCard />
        </Reveal>
      </div>
    </section>
  );
}