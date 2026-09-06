import Card from "./ui/Card";
import Reveal from "./ui/Reveal";

const testimonials = [
  {
    name: "Анна Соколова",
    role: "HR-менеджер, 31 год",
    initials: "АС",
    color: "from-pink-400 to-orange-300",
    rating: 5,
    text: "Впервые за пять лет стабильно хожу на пробежки трижды в неделю. Прогресс-бар и серии — это как игра: не хочется разрывать цепочку.",
  },
  {
    name: "Дмитрий Волков",
    role: "Разработчик, 38 лет",
    initials: "ДВ",
    color: "from-sky-400 to-cyan-300",
    rating: 5,
    text: "Привычка «10 минут медитации» держится уже 62 дня. Аналитика показала, что по вечерам я продуктивнее — и я подстроил под это расписание.",
  },
  {
    name: "Мария Крылова",
    role: "Дизайнер, 27 лет",
    initials: "МК",
    color: "from-violet-400 to-fuchsia-300",
    rating: 4,
    text: "Понравилось, что «не сделал» — не провал, а повод записать честное число. После месяца использования — новое отношение к привычкам.",
  },
];

/** Рейтинг звёздами (сколько «заполненных» звёзд — рейтинг) */
function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Рейтинг: ${count} из 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= count ? "text-accent" : "text-ink-faint/40"}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

/**
 * Блок отзывов: три карточки с аватаром-плейсхолдером и рейтингом.
 */
export default function Testimonials() {
  return (
    <section id="testimonials" className="scroll-mt-20 bg-canvas py-20" aria-label="Отзывы">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold tracking-wide text-primary uppercase">Отзывы</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">
            Что говорят пользователи
          </h2>
          <p className="mt-4 text-lg text-ink-soft">
            Почти 4 800 оценок в среднем 4,9 из 5 — вот что происходит с привычками.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 120} className="h-full">
              <Card hover className="flex h-full flex-col p-6">
                <Stars count={t.rating} />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">
                  «{t.text}»
                </p>
                <div className="mt-6 flex items-center gap-3">
                  {/* Аватар-плейсхолдер: градиентный круг с инициалами */}
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${t.color} font-display text-sm font-black text-white shadow-soft`}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{t.name}</p>
                    <p className="text-xs text-ink-soft">{t.role}</p>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}