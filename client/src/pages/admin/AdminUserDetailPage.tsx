import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Card from "../../components/ui/Card";
import { getAdminUser } from "../../lib/adminApi";
import type { AdminUser } from "../../lib/types";

const fmtDate = (iso: string) => new Date(iso).toLocaleString("ru-RU");
const NUM = new Intl.NumberFormat("ru-RU");
const PLAN_STYLE: Record<string, string> = {
  free: "bg-ink/5 text-ink-soft",
  pro: "bg-primary-soft text-primary-deep",
  premium: "bg-violet-100 text-violet-700",
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getAdminUser(id).then(setUser).catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"));
  }, [id]);

  if (error) {
    return (
      <div>
        <p className="rounded-card bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
        <Link to="/admin/users" className="mt-4 inline-block text-sm font-bold text-primary hover:underline">← Назад</Link>
      </div>
    );
  }
  if (!user) return <p className="animate-pulse text-sm font-bold text-ink-soft">Загружаем профиль…</p>;

  return (
    <div>
      <Link to="/admin/users" className="text-sm font-bold text-primary hover:underline">← Пользователи</Link>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-xl font-black text-primary-deep">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-black tracking-tight text-ink">{user.name}</h1>
            <span className={`rounded-full px-2.5 py-1 text-xs font-black ${PLAN_STYLE[user.plan]}`}>{user.plan}</span>
            {user.blocked && <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-600">заблокирован</span>}
          </div>
          <p className="text-sm text-ink-soft">{user.email}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="font-display text-2xl font-black text-ink">{user.habits}</p>
          <p className="text-xs font-bold text-ink-faint">Активных привычек</p>
        </Card>
        <Card className="p-5">
          <p className="font-display text-2xl font-black text-ink">{user.daysActive}</p>
          <p className="text-xs font-bold text-ink-faint">Дней использования</p>
        </Card>
        <Card className="p-5">
          <p className="font-display text-2xl font-black text-emerald-500">{NUM.format(user.totalPaid)} ₽</p>
          <p className="text-xs font-bold text-ink-faint">Выручка с пользователя</p>
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <h2 className="font-display text-lg font-extrabold text-ink">Профиль</h2>
        <dl className="mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4 border-b border-ink/5 py-2">
            <dt className="font-bold text-ink-soft">Регистрация</dt>
            <dd className="font-bold text-ink">{fmtDate(user.registeredAt)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-ink/5 py-2">
            <dt className="font-bold text-ink-soft">Последняя активность</dt>
            <dd className="font-bold text-ink">{fmtDate(user.lastActive)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-ink/5 py-2">
            <dt className="font-bold text-ink-soft">Email</dt>
            <dd className="font-bold text-ink">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-ink/5 py-2">
            <dt className="font-bold text-ink-soft">ID</dt>
            <dd className="font-mono text-xs font-bold text-ink-faint">{user.id}</dd>
          </div>
        </dl>
      </Card>

      <Card className="mt-5 overflow-hidden p-0">
        <div className="border-b border-ink/5 px-5 py-4">
          <h2 className="font-display text-lg font-extrabold text-ink">Последние действия</h2>
        </div>
        {user.actions.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-ink-faint">Действий пока нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/5 text-xs font-black uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3">Когда</th>
                  <th className="px-5 py-3">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {user.actions.map((a, i) => (
                  <tr key={i} className="hover:bg-canvas">
                    <td className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-ink-soft">{fmtDate(a.at)}</td>
                    <td className="px-5 py-3 font-semibold text-ink">{a.action}</td>
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