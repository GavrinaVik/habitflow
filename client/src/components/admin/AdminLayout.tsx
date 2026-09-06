import { useState } from "react";
import { Link, Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { usePageMeta } from "../../lib/seo";

const NAV = [
  { to: "/admin", label: "Дашборд", emoji: "📊", end: true },
  { to: "/admin/users", label: "Пользователи", emoji: "👥", end: false },
  { to: "/admin/payments", label: "Платежи", emoji: "💰", end: false },
  { to: "/admin/content", label: "Контент", emoji: "📝", end: false },
  { to: "/admin/bonuses", label: "Бонусы партнёров", emoji: "🎁", end: false },
  { to: "/admin/settings", label: "Настройки", emoji: "⚙️", end: false },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-btn px-4 py-2.5 text-sm font-bold transition-colors ${
    isActive ? "bg-primary text-white shadow-soft" : "text-white/70 hover:bg-white/10 hover:text-white"
  }`;

/** Доступ только для админа: 403 с кнопкой на главную */
export function ForbiddenPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4 text-center">
      <div>
        <p className="font-display text-6xl font-black text-primary">403</p>
        <h1 className="mt-3 font-display text-2xl font-black text-ink">Доступ запрещён</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Эта страница доступна только администраторам HabitFlow.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-btn bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-primary-dark"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}

/**
 * Каркас админ-панели: проверка роли, сайдбар с навигацией,
 * выход из админки и контент текущего раздела.
 */
export default function AdminLayout() {
  usePageMeta("Админ-панель");
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <p className="animate-pulse font-display text-lg font-bold text-ink-soft">Проверяем права доступа…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login?next=/admin" replace />;
  if (user.role !== "admin") return <ForbiddenPage />;

  const sidebar = (
    <>
      {/* Логотип */}
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-lg text-white shadow-soft">🛡</span>
        <div className="leading-tight">
          <p className="font-display text-lg font-black text-white">HabitFlow</p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/50">Admin</p>
        </div>
      </div>

      {/* Меню */}
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass} onClick={() => setMobileOpen(false)}>
            <span aria-hidden="true">{item.emoji}</span> {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Пользователь + выход */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 px-2 py-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-sm font-black text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold text-white">{user.name}</p>
            <p className="truncate text-[11px] text-white/50">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="w-full rounded-btn border border-white/15 px-4 py-2.5 text-sm font-bold text-white/80 transition-colors hover:bg-red-500/20 hover:text-red-300"
        >
          Выйти из админки
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      {/* Сайдбар (десктоп) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-ink lg:flex">{sidebar}</aside>

      {/* Мобильная шапка */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
        <Link to="/admin" className="flex items-center gap-2 font-display text-lg font-black text-white">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm text-white">🛡</span>
          HabitFlow Admin
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center rounded-btn text-white/80"
          aria-label="Меню админки"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </header>
      {mobileOpen && (
        <nav className="space-y-1 border-b border-ink/10 bg-ink px-3 pb-3 lg:hidden">{sidebar}</nav>
      )}

      {/* Контент */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}