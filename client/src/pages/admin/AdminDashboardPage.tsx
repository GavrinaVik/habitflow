import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import { AdminBarsChart, AdminDonut, AdminLineChart } from "../../components/admin/charts";
import { getAdminStats } from "../../lib/adminApi";
import type { AdminStats } from "../../lib/types";

const NUM = new Intl.NumberFormat("ru-RU");

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminStats().then(setStats).catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"));
  }, []);

  const cards = stats
    ? [
        { label: "Всего пользователей", value: NUM.format(stats.totalUsers), delta: `+${stats.usersGrowth}% за месяц`, emoji: "👥" },
        { label: "Активных сегодня", value: NUM.format(stats.activeToday), delta: "за 24 часа", emoji: "⚡" },
        { label: "MRR (месячный доход)", value: `${NUM.format(stats.mrr)} ₽`, delta: `+${stats.mrrGrowth}%`, emoji: "💰" },
        { label: "Конверсия Free → Pro", value: `${stats.conversion}%`, delta: "платящих от всех", emoji: "🎯" },
      ]
    : [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-black tracking-tight text-ink">Дашборд</h1>
        <p className="text-sm text-ink-soft">Сводка по сервису HabitFlow</p>
      </div>

      {error && <p className="mb-4 rounded-card bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

      {/* Карточки статистики */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c, i) => (
          <div key={c.label} className="animate-pop rounded-card border border-ink/5 bg-white p-5 shadow-soft" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between">
              <span className="text-2xl" aria-hidden="true">{c.emoji}</span>
            </div>
            <p className="mt-2 font-display text-2xl font-black text-ink">{c.value}</p>
            <p className="text-xs font-bold text-ink-faint">{c.label}</p>
            <p className="mt-1 text-[11px] font-bold text-primary">{c.delta}</p>
          </div>
        ))}
      </div>

      {/* Графики */}
      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-extrabold text-ink">Регистрации за 30 дней</h2>
          <div className="mt-3">
            {stats && <AdminLineChart data={stats.registrations30} />}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-display text-lg font-extrabold text-ink">Тарифы</h2>
          <div className="mt-4">
            {stats && <AdminDonut data={stats.planDonut} />}
          </div>
        </Card>
      </div>

      <Card className="mt-5 p-6">
        <h2 className="font-display text-lg font-extrabold text-ink">Оплаты за 12 месяцев</h2>
        <div className="mt-3">
          {stats && <AdminBarsChart data={stats.payments12} />}
        </div>
      </Card>

      {/* Последние действия */}
      <Card className="mt-5 overflow-hidden p-0">
        <div className="border-b border-ink/5 px-5 py-4">
          <h2 className="font-display text-lg font-extrabold text-ink">Последние действия</h2>
        </div>
        {!stats || stats.recentActions.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-faint">Записей пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/5 text-xs font-black uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3">Дата</th>
                  <th className="px-5 py-3">Пользователь</th>
                  <th className="px-5 py-3">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {stats.recentActions.map((a) => (
                  <tr key={a.id} className="hover:bg-canvas">
                    <td className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-ink-soft">
                      {new Date(a.at).toLocaleString("ru-RU")}
                    </td>
                    <td className="px-5 py-3 font-bold text-ink">{a.admin}</td>
                    <td className="px-5 py-3 text-ink-soft">
                      {a.action} {a.detail && <span className="text-ink-faint">— {a.detail}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}