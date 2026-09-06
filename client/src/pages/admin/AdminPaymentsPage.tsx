import { useCallback, useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { exportAdminPayments, getAdminPayments } from "../../lib/adminApi";
import type { Paged, Payment } from "../../lib/types";

const NUM = new Intl.NumberFormat("ru-RU");
const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-600",
  refunded: "bg-ink/10 text-ink-faint",
};

export default function AdminPaymentsPage() {
  const [data, setData] = useState<Paged<Payment> | null>(null);
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getAdminPayments({ status, from, to, page, limit: 20 })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"));
  }, [status, from, to, page]);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = () => {
    exportAdminPayments({ status, from, to })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка экспорта"));
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-ink">Платежи</h1>
          <p className="text-sm text-ink-soft">{data ? `Записей: ${data.total}` : "Загружаем…"}</p>
        </div>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => { e.preventDefault(); setPage(1); }}
        >
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-btn border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink outline-none"
            aria-label="Фильтр по статусу"
          >
            <option value="all">Любой статус</option>
            <option value="paid">Оплачен</option>
            <option value="failed">Ошибка</option>
            <option value="refunded">Возврат</option>
          </select>
          <input
            type="date"
            value={from}
            onChange={(e) => { setFrom(e.target.value); setPage(1); }}
            className="rounded-btn border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink outline-none"
            aria-label="Дата от"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => { setTo(e.target.value); setPage(1); }}
            className="rounded-btn border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink outline-none"
            aria-label="Дата до"
          />
          <Button type="submit" variant="outline" className="text-xs">Применить</Button>
        </form>
      </div>

      {error && <p className="mt-4 rounded-card bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-4 flex justify-end">
        <Button variant="outline" className="text-xs" onClick={handleExport}>⬇️ Скачать CSV</Button>
      </div>

      <Card className="mt-3 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-xs font-black uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3">Чек №</th>
                <th className="px-5 py-3">Пользователь</th>
                <th className="px-5 py-3">Тариф</th>
                <th className="px-5 py-3">Сумма</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {!data
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-ink/5" /></td>
                      ))}
                    </tr>
                  ))
                : data.items.map((p) => (
                    <tr key={p.id} className="hover:bg-canvas">
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-bold text-ink">{p.receiptId}</td>
                      <td className="px-5 py-3">
                        <span className="font-bold text-ink">{p.userName}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-black text-primary-deep capitalize">{p.plan}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 font-black text-ink">{NUM.format(p.amount)} ₽</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${STATUS_STYLE[p.status]}`}>
                          {p.status === "paid" ? "Оплачен" : p.status === "failed" ? "Ошибка" : "Возврат"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-ink-soft">
                        {new Date(p.date).toLocaleDateString("ru-RU")}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/5 px-5 py-3 text-sm font-bold text-ink-soft">
          {data && (
            <>
              <span>Стр. {data.page} из {data.pages}</span>
              <div className="flex gap-2">
                <Button variant="outline" className="text-xs" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>← Назад</Button>
                <Button variant="outline" className="text-xs" disabled={data.page >= data.pages} onClick={() => setPage(data.page + 1)}>Вперёд →</Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}