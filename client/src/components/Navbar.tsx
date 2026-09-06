import { useState } from "react";
import Button from "./ui/Button";
import { useAuth } from "../lib/auth";

const links = [
  { to: "/#how", label: "Как это работает" },
  { to: "/#features", label: "Возможности" },
  { to: "/pricing", label: "Тарифы" },
  { to: "/#testimonials", label: "Отзывы" },
  { to: "/#faq", label: "FAQ" },
];

/**
 * Шапка сайта: логотип, навигация и CTA.
 * Ссылки на разделы лендинга ведут через /#якорь,
 * «Тарифы» — на отдельную страницу /pricing.
 * На мобильных меню сворачивается в «бургер».
 */
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  const initial = user ? user.name.charAt(0).toUpperCase() : "";

  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Логотип */}
        <Button
          to="/"
          variant="outline"
          className="border-0 bg-transparent px-0 py-0 shadow-none hover:border-0"
          data-metrica="goal:logo-click"
          ariaLabel="HabitFlow — на главную"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-lg text-white shadow-soft">
            📈
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight text-ink">
            Habit<span className="text-primary">Flow</span>
          </span>
        </Button>

        {/* Навигация на десктопе */}
        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Button
              key={link.to}
              to={link.to}
              variant="outline"
              className="border-0 bg-transparent px-0 py-0 font-medium shadow-none hover:border-0"
              ariaLabel={link.label}
            >
              {link.label}
            </Button>
          ))}
        </div>

        {/* Кнопки на десктопе */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Button
                to="/dashboard"
                variant="outline"
                className="gap-2 px-3"
                ariaLabel="Личный кабинет"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-black text-white">
                  {initial}
                </span>
                <span className="max-w-26 truncate font-semibold">{user.name}</span>
              </Button>
              <Button variant="outline" onClick={logout} ariaLabel="Выйти" data-metrica="goal:logout">
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button to="/login" variant="outline" data-metrica="goal:nav-login">
                Войти
              </Button>
              <Button to="/pricing" data-metrica="goal:nav-start-free">
                Попробовать бесплатно
              </Button>
            </>
          )}
          {loading && (
            <span className="h-8 w-8 animate-pulse rounded-full bg-ink/10" aria-label="Загрузка" />
          )}
        </div>

        {/* «Бургер» на мобильных */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-btn text-ink-soft md:hidden"
          aria-label="Открыть меню"
          aria-expanded={open}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Мобильное меню */}
      {open && (
        <div className="animate-pop border-t border-ink/5 bg-white px-4 pb-5 pt-3 md:hidden">
          {links.map((link) => (
            <Button
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              variant="outline"
              className="mt-1 w-full justify-start border-0 bg-transparent px-3 py-2 shadow-none hover:border-0"
              ariaLabel={link.label}
            >
              {link.label}
            </Button>
          ))}
          {user && (
            <Button
              to="/dashboard"
              onClick={() => setOpen(false)}
              variant="outline"
              className="mt-1 w-full justify-start border-0 bg-transparent px-3 py-2 shadow-none hover:border-0"
              ariaLabel="Личный кабинет"
            >
              👤 {user.name}
            </Button>
          )}
          {user ? (
            <Button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              variant="outline"
              className="mt-1 w-full justify-start border-0 bg-transparent px-3 py-2 shadow-none hover:border-0"
              ariaLabel="Выйти"
            >
              Выйти
            </Button>
          ) : (
            <Button
              to="/login"
              onClick={() => setOpen(false)}
              variant="outline"
              className="mt-1 w-full justify-start border-0 bg-transparent px-3 py-2 shadow-none hover:border-0"
              ariaLabel="Войти"
            >
              Войти
            </Button>
          )}
          <Button
            to="/pricing"
            onClick={() => setOpen(false)}
            className="mt-3 w-full"
            data-metrica="goal:nav-start-free"
          >
            Попробовать бесплатно
          </Button>
        </div>
      )}
    </header>
  );
}