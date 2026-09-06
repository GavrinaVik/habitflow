import Badge from "../ui/Badge";

type Cell =
  | { kind: "yes" }
  | { kind: "no" }
  | { kind: "text"; value: string }
  | { kind: "highlight"; value: string };

interface ComparisonRow {
  label: string;
  free: Cell;
  pro: Cell;
  premium: Cell;
}

const rows: ComparisonRow[] = [
  {
    label: "Количество привычек",
    free: { kind: "text", value: "3" },
    pro: { kind: "text", value: "10" },
    premium: { kind: "highlight", value: "Безлимит" },
  },
  {
    label: "График и аналитика",
    free: { kind: "text", value: "Базовый (7 дней)" },
    pro: { kind: "text", value: "Полная: месяц, год, всё время" },
    premium: { kind: "text", value: "Полная: месяц, год, всё время" },
  },
  {
    label: "История",
    free: { kind: "text", value: "2 недели" },
    pro: { kind: "text", value: "Безлимит" },
    premium: { kind: "text", value: "Безлимит" },
  },
  {
    label: "Отсутствие рекламы",
    free: { kind: "no" },
    pro: { kind: "yes" },
    premium: { kind: "yes" },
  },
  {
    label: "Google Calendar",
    free: { kind: "no" },
    pro: { kind: "no" },
    premium: { kind: "yes" },
  },
  {
    label: "Бонусы партнёров",
    free: { kind: "no" },
    pro: { kind: "no" },
    premium: { kind: "yes" },
  },
];

/** Ячейка таблицы: ✓ / ✗ / текст-лимит */
function CellView({ cell }: { cell: Cell }) {
  if (cell.kind === "yes") {
    return (
      <span
        className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-dark"
        aria-label="Включено"
      >
        ✓
      </span>
    );
  }
  if (cell.kind === "no") {
    return (
      <span
        className="mx-auto grid h-6 w-6 place-items-center rounded-full bg-ink/5 text-xs font-bold text-ink-faint"
        aria-label="Не включено"
      >
        ✗
      </span>
    );
  }
  if (cell.kind === "highlight") {
    return <span className="font-bold text-violet-600">{cell.value}</span>;
  }
  return <span className="text-ink-soft">{cell.value}</span>;
}

const columnHead =
  "px-4 py-4 text-sm font-bold text-ink";
const columnCell = "px-4 py-3.5 text-center text-sm";

/**
 * Таблица сравнения тарифов: строки — возможности, столбцы — Free/Pro/Premium.
 * Иконки: ✓ включено, ✗ не включено, число — лимит.
 */
export default function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-card border border-ink/10 bg-white p-2 shadow-soft">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <caption className="sr-only">Сравнение тарифов HabitFlow</caption>
        <thead>
          <tr className="border-b border-ink/10">
            <th scope="col" className={columnHead}>Возможность</th>
            <th scope="col" className={columnHead + " bg-canvas"}>🌱 Free</th>
            <th scope="col" className={`${columnHead} bg-violet-50 relative`}>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="violet">⭐ Популярный</Badge>
              </span>
              🚀 Pro
            </th>
            <th scope="col" className={columnHead + " bg-canvas"}>💎 Premium</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-ink/5 last:border-0">
              <th scope="row" className="px-4 py-3.5 text-sm font-semibold text-ink">
                {row.label}
              </th>
              <td className={`${columnCell} bg-canvas/50`}>
                <CellView cell={row.free} />
              </td>
              <td className={`${columnCell} bg-violet-50/60`}>
                <CellView cell={row.pro} />
              </td>
              <td className={`${columnCell} bg-canvas/50`}>
                <CellView cell={row.premium} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}