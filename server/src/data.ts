export interface PricingFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  emoji: string;
  monthlyPrice: number | null;
  yearlyPrice: number;
  ctaLabel: string;
  highlighted: boolean;
  features: PricingFeature[];
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

export interface Checkin {
  date: string;
  done: boolean;
  value: number;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  target: number;
  unit: string;
  streak: number;
  color: string;
  /** Регулярность: "daily" | "every-other" | "3x" | "5x" */
  frequency: string;
  /** Время напоминания "HH:MM" или null (без напоминания) */
  reminderTime: string | null;
  history: Checkin[];
}

/** Поля для создания/редактирования привычки */
export type HabitPatch = Partial<
  Pick<Habit, "name" | "emoji" | "target" | "unit" | "color" | "frequency" | "reminderTime">
>;

export interface HabitStats {
  habitId: string;
  /** Всего дней в истории */
  total: number;
  /** Дней, где цель выполнена полностью */
  doneCount: number;
  /** Процент дней с полным выполнением */
  completionRate: number;
  /** Сумма всех значений за историю */
  totalValue: number;
  /** Текущая серия (подряд идущие полностью выполненные дни) */
  currentStreak: number;
  /** Лучшая серия за всю историю */
  bestStreak: number;
  /** Значения за последние 7 дней (для графика на детальной странице) */
  last7: number[];
}

export const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    emoji: "🌱",
    monthlyPrice: 0,
    yearlyPrice: 0,
    ctaLabel: "Начать бесплатно",
    highlighted: false,
    features: [
      { text: "3 активные привычки", included: true },
      { text: "Базовый график (7 дней)", included: true },
      { text: "Мотивационные фразы", included: true },
      { text: "История ограничена 2 неделями", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    emoji: "🚀",
    monthlyPrice: 299,
    yearlyPrice: 2990,
    ctaLabel: "Выбрать Pro",
    highlighted: true,
    features: [
      { text: "10 привычек", included: true },
      { text: "Полная аналитика: месяц, год, всё время", included: true },
      { text: "Без рекламы", included: true },
      { text: "Приоритетная поддержка", included: true },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    emoji: "💎",
    monthlyPrice: null,
    yearlyPrice: 2990,
    ctaLabel: "Выбрать Premium",
    highlighted: false,
    features: [
      { text: "Безлимит привычек", included: true },
      { text: "Google Calendar интеграция", included: true },
      { text: "Бонусы от партнёров", included: true },
      { text: "Всё из Pro", included: true },
    ],
  },
];

export const PRICING_FAQ: FaqItem[] = [
  {
    id: 1,
    question: "Можно ли сменить тариф?",
    answer:
      "Да, в любой момент в разделе «Настройки → Подписка». При переходе на тариф дороже разница оплачивается пропорционально, при понижении — оставшиеся дни переносятся на новый тариф.",
  },
  {
    id: 2,
    question: "Как работает автопродление?",
    answer:
      "Подписка продлевается автоматически в конце периода. За день до списания мы отправляем напоминание на почту, а отключить автопродление можно в один клик в настройках.",
  },
  {
    id: 3,
    question: "Есть ли пробный период?",
    answer:
      "Да. Для тарифа Pro — 7 бесплатных дней, для Premium — 14 дней. В течение пробного периода подписку можно отменить без списаний.",
  },
];

export const FAQ: FaqItem[] = [
  {
    id: 1,
    question: "Как отменить подписку?",
    answer:
      "Отменить подписку можно в один клик в разделе «Настройки → Подписка». После отмены тариф продолжит работать до конца оплаченного периода — никаких списаний в автоматическом режиме.",
  },
  {
    id: 2,
    question: "Можно ли вернуть деньги?",
    answer:
      "Да. Если в течение 14 дней с момента оплаты вы передумали, напишите нам на support@habitflow.app — мы вернём полную стоимость без лишних вопросов.",
  },
  {
    id: 3,
    question: "Как синхронизировать с Google Calendar?",
    answer:
      "Функция доступна на тарифе Premium. Подключите Google-аккаунт в настройках — ваши ежедневные цели автоматически появятся в календаре как события с напоминанием.",
  },
  {
    id: 4,
    question: "Есть ли мобильное приложение?",
    answer:
      "Пока HabitFlow работает в браузере — на телефоне и компьютере. Интерфейс полностью адаптивный: добавьте сайт на главный экран, и он будет вести себя как приложение.",
  },
  {
    id: 5,
    question: "Какие способы оплаты принимаете?",
    answer:
      "Принимаем карты Мир, Visa, Mastercard и оплату через СБП. Все платежи проходят через защищённый шлюз ЮKassa — данные карты не хранятся на наших серверах.",
  },
  {
    id: 6,
    question: "Что произойдёт, если я пропущу день?",
    answer:
      "Серия (streak) прервётся, но привычка останется с вами. Главное правило HabitFlow — не «всё или ничего»: даже 60% выполнения — это прогресс, и график это честно покажет.",
  },
  {
    id: 7,
    question: "Можно ли пользоваться HabitFlow бесплатно?",
    answer:
      "Конечно. Тариф Free включает 3 активные привычки, базовые графики и историю за 2 недели — этого достаточно, чтобы сформировать первую серию и почувствовать удовольствие от прогресса.",
  },
];

const lastNDays = (n: number): string[] => {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
};

/**
 * Демо-данные дашборда: 5 привычек с историей на 14 дней.
 * Сегодня (последний элемент истории) —
 * Приседания и Прогулка выполнены полностью, Вода частично,
 * Чтение и Медитация не начаты. Так сразу видно все состояния карточек.
 */
export const seedHabits = (): Habit[] => {
  const days = lastNDays(14);

  const full = (value: number, skip: number[] = []): Checkin[] =>
    days.map((date, idx) => ({
      date,
      done: !skip.includes(idx),
      value: skip.includes(idx) ? 0 : value,
    }));

  const squash: Checkin[] = days.map((date, idx) => ({
    date,
    done: idx !== 1 && idx !== 13 ? true : idx === 13,
    value: idx === 1 ? 20 : idx === 13 ? 50 : 42 + (idx % 5) * 3,
  }));

  const water: Checkin[] = days.map((date, idx) => ({
    date,
    done: idx === 13 ? false : idx !== 3 && idx !== 9,
    value: idx === 13 ? 5 : idx === 3 || idx === 9 ? 3 : 8,
  }));

  const reading: Checkin[] = days.map((date, idx) =>
    idx === 13
      ? { date, done: false, value: 0 } // сегодня ещё не начато
      : {
          date,
          done: idx % 4 !== 0,
          value: idx % 4 === 0 ? 0 : 12 + (idx % 7) * 2,
        }
  );

  const walking = full(10000, [7, 11]);
  const meditation = full(15, [13]);

  return [
    {
      id: "h1",
      name: "Приседания",
      emoji: "💪",
      target: 50,
      unit: "приседаний",
      streak: 8,
      color: "#10b981",
      frequency: "daily",
      reminderTime: "19:00",
      history: squash,
    },
    {
      id: "h2",
      name: "Вода",
      emoji: "🚰",
      target: 8,
      unit: "стаканов",
      streak: 4,
      color: "#3b82f6",
      frequency: "daily",
      reminderTime: "08:00",
      history: water,
    },
    {
      id: "h3",
      name: "Чтение",
      emoji: "📚",
      target: 20,
      unit: "страниц",
      streak: 0,
      color: "#8b5cf6",
      frequency: "daily",
      reminderTime: null,
      history: reading,
    },
    {
      id: "h4",
      name: "Прогулка",
      emoji: "🚶",
      target: 10000,
      unit: "шагов",
      streak: 6,
      color: "#f59e0b",
      frequency: "every-other",
      reminderTime: "12:30",
      history: walking,
    },
    {
      id: "h5",
      name: "Медитация",
      emoji: "🧘",
      target: 15,
      unit: "минут",
      streak: 2,
      color: "#ec4899",
      frequency: "daily",
      reminderTime: "21:00",
      history: meditation,
    },
  ];
};

let habits = seedHabits();

export const getHabits = (): Habit[] => habits;

export const getHabitById = (id: string): Habit | undefined =>
  habits.find((h) => h.id === id);

export const createHabit = (
  habit: Pick<
    Habit,
    "name" | "emoji" | "target" | "unit" | "color" | "frequency" | "reminderTime"
  >
): Habit => {
  const created: Habit = {
    id: `h${habits.length + 1}`,
    streak: 0,
    history: [],
    ...habit,
  };
  habits = [created, ...habits];
  return created;
};

export const updateHabit = (id: string, patch: HabitPatch): Habit | undefined => {
  const habit = getHabitById(id);
  if (!habit) return undefined;
  Object.assign(habit, {
    name: patch.name ?? habit.name,
    emoji: patch.emoji ?? habit.emoji,
    target: patch.target ?? habit.target,
    unit: patch.unit ?? habit.unit,
    color: patch.color ?? habit.color,
    frequency: patch.frequency ?? habit.frequency,
    reminderTime: patch.reminderTime ?? habit.reminderTime,
  });
  return habit;
};

export const deleteHabit = (id: string): boolean => {
  const before = habits.length;
  habits = habits.filter((h) => h.id !== id);
  return habits.length < before;
};

/** Записать частичное/полное выполнение за сегодня: value — сколько сделано */
export const logHabit = (id: string, value: number): Habit | undefined => {
  const habit = getHabitById(id);
  if (!habit) return undefined;

  const today = new Date().toISOString().slice(0, 10);
  const done = value >= habit.target;
  const existing = habit.history.find((h) => h.date === today);
  if (existing) {
    existing.value = value;
    existing.done = done;
  } else {
    habit.history.push({ date: today, done, value });
  }
  return habit;
};

/** Подсчитать статистику привычки */
export const getHabitStats = (id: string): HabitStats | undefined => {
  const habit = getHabitById(id);
  if (!habit) return undefined;

  const days = [...habit.history].sort((a, b) => a.date.localeCompare(b.date));
  const total = days.length;
  const doneCount = days.filter((d) => d.done).length;
  const totalValue = days.reduce((s, d) => s + d.value, 0);

  // Текущая серия: идём с конца, пропуская только сегодняшний «провал» при подсчёте
  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].done) currentStreak += 1;
    else break;
  }

  let bestStreak = 0;
  let run = 0;
  for (const d of days) {
    if (d.done) {
      run += 1;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
  }

  const last7 = days.slice(-7).map((d) => d.value);

  return {
    habitId: id,
    total,
    doneCount,
    completionRate: total ? Math.round((doneCount / total) * 100) : 0,
    totalValue,
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    last7,
  };
};

export const resetMockData = (): void => {
  habits = seedHabits();
};

/** История с пагинацией (новые сверху) */
export const getHabitHistory = (
  id: string,
  page = 1,
  limit = 10
):
  | { items: Checkin[]; total: number; page: number; pages: number; limit: number }
  | undefined => {
  const habit = getHabitById(id);
  if (!habit) return undefined;
  const all = [...habit.history].sort((a, b) => b.date.localeCompare(a.date));
  const total = all.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), pages);
  return {
    items: all.slice((safePage - 1) * limit, safePage * limit),
    total,
    page: safePage,
    pages,
    limit,
  };
};

const csvEscape = (value: string): string =>
  /[;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/** Экспорт истории в CSV (разделитель «;» для русского Excel) */
export const exportHabitCsv = (id: string): string | undefined => {
  const habit = getHabitById(id);
  if (!habit) return undefined;
  const rows = [
    ["Дата", "План", "Факт", "Процент", "Статус"],
    ...[...habit.history]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((c) => {
        const pct = Math.min(100, Math.round((c.value / habit.target) * 100));
        const status = c.done ? "Выполнено" : c.value > 0 ? "Частично" : "Пропуск";
        return [c.date, String(habit.target), String(c.value), String(pct), status];
      }),
  ];
  return rows.map((r) => r.map(csvEscape).join(";")).join("\r\n");
};