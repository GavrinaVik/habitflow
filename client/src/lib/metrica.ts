/**
 * Яндекс.Метрика — цели (голая обвязка над window.ym).
 *
 * Сниппет счётчика подключён в index.html (в проде — реальный mc.yandex.ru,
 * здесь — локальная заглушка, пишущая цели в window.__METRIKA_HITS__).
 * Цели: registration, pricing-view, payment, create-habit, habit-checkin,
 * visit_duration, а также data-metrica="goal:..." на кнопках.
 */

export const METRIKA_ID = 98765432;

/** Отправить цель «JavaScript-событие» */
export function reachGoal(goal: string): void {
  try {
    const w = window as unknown as { ym?: (id: number, action: string, ...args: unknown[]) => void };
    if (typeof w.ym === "function") w.ym(METRIKA_ID, "reachGoal", goal);
  } catch {
    /* аналитика не должна ломать интерфейс */
  }
}

/** Отметить глубину сессии: фиксируем цель, если человек провёл на сайте > 30 сек */
export function initVisitTiming(): void {
  try {
    const timer = window.setTimeout(() => reachGoal("visit_duration"), 30_000);
    window.addEventListener("beforeunload", () => window.clearTimeout(timer), { once: true });
  } catch {
    /* noop */
  }
}