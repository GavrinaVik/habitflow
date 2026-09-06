import { useCallback, useEffect, useState } from "react";
import { postJson, requestJson } from "../lib/api";
import { reachGoal } from "../lib/metrica";
import type {
  Habit,
  HabitDay,
  HabitHistoryPage,
  HabitInput,
  HabitPatch,
  HabitPeriod,
  HabitStats,
  PeriodStats,
} from "../lib/types";

/** Считать текущую серию выполненных дней из истории (с конца) */
export function habitStreak(history: Habit["history"]): number {
  let s = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].done) s++;
    else break;
  }
  return s;
}

/** Выполнение за конкретную дату (для календаря) */
export function checkinFor(habit: Habit, date: string): Habit["history"][number] | undefined {
  return habit.history.find((h) => h.date === date);
}

const lastNDates = (n: number): string[] => {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

/**
 * Ряд точек для графика за выбранный период.
 * Для «Неделя»/«Месяц» дополняем пропущенные дни нулями,
 * для «Всё время» — все дни из истории.
 */
export function seriesFor(habit: Habit, period: HabitPeriod): HabitDay[] {
  const map = new Map(habit.history.map((c) => [c.date, c]));
  let dates: string[];
  if (period === "all") {
    dates = [...habit.history].map((c) => c.date).sort();
  } else {
    dates = lastNDates(period === "week" ? 7 : 30);
  }
  return dates.map((date) => {
    const c = map.get(date);
    const fact = c?.value ?? 0;
    return {
      date,
      plan: habit.target,
      fact,
      percent: habit.target > 0 ? Math.min(100, Math.round((fact / habit.target) * 100)) : 0,
    };
  });
}

/** Агрегированная статистика за выбранный период */
export function periodStats(series: HabitDay[]): PeriodStats {
  const total = series.length;
  const avg = total ? Math.round(series.reduce((s, x) => s + x.percent, 0) / total) : 0;
  const done = series.filter((s) => s.fact >= s.plan && s.fact > 0).length;

  const best = [...series].sort(
    (a, b) => b.percent - a.percent || b.fact - a.fact
  )[0];
  const withFact = series.filter((s) => s.fact > 0);
  const worst = [...(withFact.length ? withFact : series)].sort(
    (a, b) => a.percent - b.percent
  )[0];

  let streak = 0;
  for (let i = total - 1; i >= 0; i--) {
    if (series[i].fact >= series[i].plan && series[i].fact > 0) streak++;
    else break;
  }

  return {
    avg,
    bestDate: best?.date ?? "",
    bestPercent: best?.percent ?? 0,
    worstDate: worst?.date ?? "",
    worstPercent: worst?.percent ?? 0,
    streak,
    done,
    total,
  };
}

/** Человекочитаемая подпись периода для инструментов не нужна */
export function frequencyLabel(frequency: string): string {
  switch (frequency) {
    case "daily":
      return "Ежедневно";
    case "every-other":
      return "Через день";
    case "3x":
      return "3 раза в неделю";
    case "5x":
      return "5 раз в неделю";
    default:
      return frequency;
  }
}

/**
 * Хук управления привычками в личном кабинете:
 * список + CRUD + отметка выполнения, всё синхронизируется с API.
 */
export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const data = await requestJson<Habit[]>("/api/habits");
      setHabits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить привычки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = useCallback(async (input: HabitInput): Promise<Habit> => {
    const created = await postJson<Habit>("/api/habits", input);
    setHabits((prev) => [created, ...prev]);
    reachGoal("create-habit");
    return created;
  }, []);

  const update = useCallback(
    async (id: string, patch: HabitPatch): Promise<Habit> => {
      const updated = await requestJson<Habit>(`/api/habits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
      return updated;
    },
    []
  );

  const remove = useCallback(async (id: string): Promise<void> => {
    await requestJson<{ ok: boolean }>(`/api/habits/${id}`, { method: "DELETE" });
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const log = useCallback(async (id: string, value: number): Promise<Habit> => {
    const updated = await postJson<Habit>(`/api/habits/${id}/log`, { value });
    setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
    reachGoal("habit-checkin");
    return updated;
  }, []);

  const stats = useCallback(
    (id: string): Promise<HabitStats> => requestJson<HabitStats>(`/api/habits/${id}/stats`),
    []
  );

  /** История с пагинацией */
  const history = useCallback(
    (id: string, page = 1, limit = 10): Promise<HabitHistoryPage> =>
      requestJson<HabitHistoryPage>(`/api/habits/${id}/history?page=${page}&limit=${limit}`),
    []
  );

  return { habits, loading, error, refresh, create, update, remove, log, stats, history };
}