import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { useAuth } from "../../lib/auth";

const MENU = [
  { to: "#habits", label: "Мои привычки" },
  { to: "#stats", label: "Аналитика" },
  { to: "/settings", label: "Настройки" },
];

const planBadge: Record<string, { label: string; variant: "default" | "primary" | "violet" }> = {
  free: { label: "Free", variant: "default" },
  pro: { label: "Pro", variant: "primary" },
  premium: { label: "Premium", variant: "violet" },
};

/**
 * Шапка личного кабинета: логотип, меню, бейдж тарифа
 * и аватар с выпадающим меню (профиль / выход).
 */
export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрываем дропдаун по клику вне его
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const badge = planBadge[user?.plan ?? "free"] ?? planBadge.free;
  const initial = user ? user.name.charAt(0).toUpperCase() : "";

  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Логотип */}
        <Button
          to="/"
          variant="outline"
          className="border-0 bg-transparent px-0 py-0 shadow-none hover:border-0"
          ariaLabel="HabitFlow — на главную"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-lg text-white shadow-soft">
            📈
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight text-ink">
            Habit<span className="text-primary">Flow</span>
          </span>
        </Button>

        {/* Меню (десктоп) */}
        <div className="hidden items-center gap-6 md:flex">
          {MENU.map((item) => (
            <Button
              key={item.label}
              to={item.to}
              variant="outline"
              className="border-0 bg-transparent px-0 py-0 font-medium text-ink-soft shadow-none hover:border-0 hover:text-primary"
              ariaLabel={item.label}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Бейдж тарифа */}
          <Badge variant={badge.variant}>{badge.label}</Badge>

          {/* Аватар + дропдаун */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-primary-deep font-display text-sm font-black text-white shadow-soft transition-transform hover:scale-105"
              aria-label="Меню пользователя"
              aria-expanded={open}
            >
              {initial}
            </button>

            {open && (
              <div className="animate-pop absolute right-0 mt-2 w-60 overflow-hidden rounded-card border border-ink/5 bg-white shadow-lift">
                <div className="border-b border-ink/5 px-4 py-3">
                  <p className="truncate font-display font-extrabold text-ink">{user?.name}</p>
                  <p className="truncate text-xs text-ink-faint">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate("/dashboard");
                    }}
                    className="w-full rounded-btn px-3 py-2 text-left text-sm font-semibold text-ink transition-colors hover:bg-canvas"
                  >
                    👤 Профиль
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate("/settings");
                    }}
                    className="w-full rounded-btn px-3 py-2 text-left text-sm font-semibold text-ink transition-colors hover:bg-canvas"
                  >
                    ⚙️ Настройки
                  </button>
                  {user?.role === "admin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        navigate("/admin");
                      }}
                      className="w-full rounded-btn px-3 py-2 text-left text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
                    >
                      🛡 Админ-панель
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      logout();
                      navigate("/");
                    }}
                    className="w-full rounded-btn px-3 py-2 text-left text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Бургер на мобильных */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-btn text-ink-soft md:hidden"
            aria-label="Открыть меню"
            aria-expanded={menuOpen}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
              ) : (
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Мобильное меню */}
      {menuOpen && (
        <div className="animate-pop border-t border-ink/5 bg-white px-4 pb-4 pt-2 md:hidden">
          {MENU.map((item) => (
            <Button
              key={item.label}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              variant="outline"
              className="mt-1 w-full justify-start border-0 bg-transparent px-3 py-2 shadow-none hover:border-0"
              ariaLabel={item.label}
            >
              {item.label}
            </Button>
          ))}
        </div>
      )}
    </header>
  );
}