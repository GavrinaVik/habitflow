import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import {
  deleteAdminUser,
  getAdminSettings,
  getAdminUsers,
  setAdminUserBlocked,
  setAdminUserPlan,
} from "../../lib/adminApi";
import type { AdminSettings, AdminUser, Paged } from "../../lib/types";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU");
const PLAN_STYLE: Record<string, string> = {
  free: "bg-ink/5 text-ink-soft",
  pro: "bg-primary-soft text-primary-deep",
  premium: "bg-violet-100 text-violet-700",
};

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Paged<AdminUser> | null>(null);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [active, setActive] = useState("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  // Для модалок
  const [emailTarget, setEmailTarget] = useState<AdminUser | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [selectedTpl, setSelectedTpl] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getAdminSettings().then(setSettings).catch(() => {});
  }, []);

  const load = useCallback(() => {
    getAdminUsers({ search: appliedSearch, plan, active, page, limit: 20 })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"));
  }, [appliedSearch, plan, active, page]);

  useEffect(() => {
    load();
  }, [load]);

  const patchLocal = (updated: AdminUser) => {
    setData((d) => (d ? { ...d, items: d.items.map((u) => (u.id === updated.id ? updated : u)) } : d));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminUser(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка удаления");
    } finally {
      setDeleting(false);
    }
  };

  const confirmDeleted = settings?.emailTemplates[0];
  const tpl = settings?.emailTemplates.find((t) => t.id === selectedTpl) ?? confirmDeleted;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-ink">Пользователи</h1>
          <p className="text-sm text-ink-soft">{data ? `Записей: ${data.total}` : "Загружаем…"}</p>
        </div>
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setAppliedSearch(search);
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по email или имени…"
            className="w-56 rounded-btn border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            aria-label="Поиск пользователя"
          />
          <select
            value={plan}
            onChange={(e) => { setPlan(e.target.value); setPage(1); }}
            className="rounded-btn border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink outline-none"
            aria-label="Фильтр по тарифу"
          >
            <option value="all">Все тарифы</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="premium">Premium</option>
          </select>
          <select
            value={active}
            onChange={(e) => { setActive(e.target.value); setPage(1); }}
            className="rounded-btn border border-ink/10 bg-white px-3 py-2 text-sm font-bold text-ink outline-none"
            aria-label="Фильтр по активности"
          >
            <option value="all">Все</option>
            <option value="active">Активные</option>
            <option value="blocked">Заблокированные</option>
          </select>
          <Button type="submit" className="text-xs">Найти</Button>
        </form>
      </div>

      {error && <p className="mt-4 rounded-card bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

      <Card className="mt-4 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/5 text-xs font-black uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Имя</th>
                <th className="px-5 py-3">Тариф</th>
                <th className="px-5 py-3">Регистрация</th>
                <th className="px-5 py-3">Активность</th>
                <th className="px-5 py-3">Действия</th>
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
                : data.items.map((u) => (
                    <tr key={u.id} className="hover:bg-canvas">
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/users/${u.id}`)}
                          className="font-bold text-primary hover:underline"
                        >
                          {u.email}
                        </button>
                        {u.blocked && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-600">заблокирован</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-semibold text-ink">{u.name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={u.plan}
                          onChange={(e) => setAdminUserPlan(u.id, e.target.value).then(patchLocal).catch((err) => setError(err.message))}
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-black outline-none ${PLAN_STYLE[u.plan] ?? PLAN_STYLE.free}`}
                          aria-label={`Тариф ${u.name}`}
                        >
                          <option value="free">Free</option>
                          <option value="pro">Pro</option>
                          <option value="premium">Premium</option>
                        </select>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-ink-soft">{fmtDate(u.registeredAt)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs font-semibold text-ink-soft">{fmtDate(u.lastActive)}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Button variant="outline" className="px-2.5 py-1 text-[11px]" onClick={() => setEmailTarget(u)}>
                            ✉️ Письмо
                          </Button>
                          <Button
                            variant="outline"
                            className={`px-2.5 py-1 text-[11px] ${u.blocked ? "text-primary" : "text-red-500"}`}
                            onClick={() => {
                              setAdminUserBlocked(u.id, !u.blocked).then(patchLocal).catch((err) => setError(err.message));
                            }}
                          >
                            {u.blocked ? "Разблокировать" : "Заблокировать"}
                          </Button>
                          <Button
                            variant="outline"
                            className="px-2.5 py-1 text-[11px] text-red-500"
                            onClick={() => setDeleteTarget(u)}
                          >
                            Удалить
                          </Button>
                        </div>
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

      {/* Модалка письма */}
      <Modal open={emailTarget !== null} onClose={() => { setEmailTarget(null); setEmailSent(false); }} title={`Письмо: ${emailTarget?.email ?? ""}`}>
        {emailSent ? (
          <div className="py-6 text-center">
            <p className="text-3xl" aria-hidden="true">📨</p>
            <p className="mt-2 font-display text-lg font-extrabold text-ink">Письмо отправлено</p>
            <p className="mt-1 text-sm text-ink-soft">Шаблон применён, сервис почты получил задачу.</p>
            <Button className="mt-4" onClick={() => { setEmailTarget(null); setEmailSent(false); }}>Готово</Button>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-ink-faint">Шаблон</label>
            <select
              value={selectedTpl}
              onChange={(e) => setSelectedTpl(e.target.value)}
              className="mt-2 w-full rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-bold text-ink outline-none focus:border-primary"
            >
              {!settings || settings.emailTemplates.length === 0 ? (
                <option value="">Шаблонов нет</option>
              ) : (
                settings.emailTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))
              )}
            </select>
            {tpl && emailTarget && (
              <div className="mt-4 rounded-card border border-ink/10 bg-canvas p-4">
                <p className="text-sm font-bold text-ink">
                  Тема: {tpl.subject.replaceAll("{{имя}}", emailTarget.name)}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">
                  {tpl.body.replaceAll("{{имя}}", emailTarget.name)}
                </p>
              </div>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEmailTarget(null)}>Отмена</Button>
              <Button onClick={() => setEmailSent(true)} disabled={!tpl}>Отправить</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Подтверждение удаления */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Удалить аккаунт?">
        <p className="text-sm text-ink-soft">
          Аккаунт <b className="text-ink">{deleteTarget?.email}</b> ({deleteTarget?.name}) будет удалён безвозвратно
          вместе с привычками и данными платежей.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Отмена</Button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-btn bg-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-red-600 disabled:opacity-70"
          >
            {deleting ? "Удаляем…" : "Удалить"}
          </button>
        </div>
      </Modal>
    </div>
  );
}