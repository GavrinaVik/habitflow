import type { Habit, HabitHistoryPage } from "../../lib/types";
import Button from "../ui/Button";

const DAY_SHORT = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });
const NUM = new Intl.NumberFormat("ru-RU");

interface HistoryTableProps {
  habit: Habit;
  data: HabitHistoryPage | null;
  onPage: (page: number) => void;
  /** Тариф: "free" | "pro" | "premium" */
  plan: string;
  exporting: boolean;
  onExport: () => void;
}

/** История выполнения: таблица Дата | План | Факт | % | Статус, пагинация, экспорт CSV (Pro) */
export default function HistoryTable({
  habit,
  data,
  onPage,
  plan,
  exporting,
  onExport,
}: HistoryTableProps) {
  const isPro = plan !== "free";

  return (
    <div className="overflow-hidden rounded-card border border-ink/5 bg-white shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/5 px-5 py-4">
        <h2 className="font-display text-2xl font-black tracking-tight text-ink">История выполнения</h2>
        {isPro ? (
          <Button variant="outline" onClick={onExport} loading={exporting} className="text-xs">
            ⬇ Скачать CSV
          </Button>
        ) : (
          <Button variant="outline" disabled className="cursor-not-allowed text-xs opacity-60" ariaLabel="Экспорт CSV доступен на тарифе Pro">
            🔒 Скачать CSV · Pro
          </Button>
        )}
      </div>

      {!data || data.items.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-ink-faint">
          Пока нет ни одной отметки
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/5 text-xs font-black uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3">Дата</th>
                  <th className="px-5 py-3">План</th>
                  <th className="px-5 py-3">Факт</th>
                  <th className="px-5 py-3">%</th>
                  <th className="px-5 py-3">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {data.items.map((c) => {
                  const percent = habit.target
                    ? Math.min(100, Math.round((c.value / habit.target) * 100))
                    : 0;
                  const status =
                    c.done || (c.value >= habit.target && c.value > 0)
                      ? { label: "Выполнено", emoji: "✅", color: "bg-primary-soft text-primary-deep" }
                      : c.value > 0
                        ? { label: "Частично", emoji: "⚠️", color: "bg-accent-soft text-accent-dark" }
                        : { label: "Пропуск", emoji: "❌", color: "bg-ink/5 text-ink-soft" };
                  return (
                    <tr key={c.date} className="hover:bg-canvas">
                      <td className="px-5 py-3 font-semibold text-ink">
                        {DAY_SHORT.format(new Date(`${c.date}T00:00:00`))}
                      </td>
                      <td className="px-5 py-3 text-ink-soft">
                        {NUM.format(habit.target)} {habit.unit}
                      </td>
                      <td className="px-5 py-3 font-bold text-ink">{NUM.format(c.value)}</td>
                      <td className="px-5 py-3 font-bold text-ink">{percent}%</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${status.color}`}>
                          {status.emoji} {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 px-5 py-3 text-sm font-bold text-ink-soft">
            <span>
              Записей: {data.total} · стр. {data.page} из {data.pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={data.page <= 1}
                onClick={() => onPage(data.page - 1)}
                className="text-xs"
                ariaLabel="Предыдущая страница"
              >
                ← Назад
              </Button>
              <Button
                variant="outline"
                disabled={data.page >= data.pages}
                onClick={() => onPage(data.page + 1)}
                className="text-xs"
                ariaLabel="Следующая страница"
              >
                Вперёд →
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}