import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Card from "../components/ui/Card";
import { useAuth } from "../lib/auth";
import { useHabits } from "../hooks/useHabits";
import Greeting from "../components/dashboard/Greeting";
import HabitCard from "../components/dashboard/HabitCard";
import WeekCalendar from "../components/dashboard/WeekCalendar";
import QuickStats from "../components/dashboard/QuickStats";
import CheckInModal from "../components/dashboard/CheckInModal";
import HabitFormModal from "../components/dashboard/HabitFormModal";
import Reveal from "../components/ui/Reveal";
import type { Habit, HabitInput } from "../lib/types";

/**
 * Личный кабинет: шапка с тарифом, приветствие, карточки привычек
 * с отметкой выполнения, календарь на неделю и быстрая статистика.
 * Маршрут требует сессии — без неё редирект на вход.
 */
export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { habits, loading: habitsLoading, error, create, log } = useHabits();
  const [checking, setChecking] = useState<Habit | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [limitNote, setLimitNote] = useState(false);

  if (loading) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4">
        <p className="animate-pulse font-display text-lg font-bold text-ink-soft">Загрузка…</p>
      </main>
    );
  }
  if (!user) {
    return <Navigate to="/login?next=/dashboard" replace />;
  }

  const freeLimit = user.plan === "free" && habits.length >= 3;

  const handleAdd = () => {
    if (freeLimit) {
      setLimitNote(true);
      return;
    }
    setLimitNote(false);
    setFormOpen(true);
  };

  const handleSave = (input: HabitInput) => create(input);

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Приветствие и дата */}
        <Reveal>
          <Greeting name={user.name} onAdd={handleAdd} />
        </Reveal>

        {/* Лимит Free-тарифа */}
        {limitNote && (
          <p className="animate-pop mt-5 flex flex-wrap items-center gap-3 rounded-card border border-accent/30 bg-accent-soft px-4 py-3 text-sm font-semibold text-accent-dark" role="alert">
            На тарифе Free максимум 3 привычки. Чтобы добавить больше —{" "}
            <Link to="/pricing" className="font-black underline decoration-2 underline-offset-2">
              улучшите тариф
            </Link>
            .
          </p>
        )}

        {error && (
          <p className="mt-5 rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">
            {error}
          </p>
        )}

        {/* Список привычек */}
        <section id="habits" className="mt-10 scroll-mt-24" aria-label="Мои привычки">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-black tracking-tight text-ink">
              Мои привычки
            </h2>
            <p className="text-sm text-ink-faint">
              {habits.filter((h) =>
                h.history.find((c) => c.date === new Date().toISOString().slice(0, 10))?.done
              ).length}{" "}
              из {habits.length} выполнено сегодня
            </p>
          </div>

          <div className="mt-5">
            {habitsLoading ? (
              <p className="animate-pulse py-10 text-center font-display text-lg font-bold text-ink-soft">
                Грузим привычки…
              </p>
            ) : habits.length === 0 ? (
              <Card className="p-10 text-center">
                <p className="text-3xl" aria-hidden="true">🌱</p>
                <p className="mt-3 font-display text-lg font-extrabold text-ink">
                  Список привычек пуст
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Добавьте первую привычку — и начните серию сегодня!
                </p>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="mt-5 rounded-btn bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-primary-dark"
                >
                  + Добавить привычку
                </button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {habits.map((h) => (
                  <HabitCard key={h.id} habit={h} onCheckIn={setChecking} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Календарь на неделю */}
        <Reveal className="mt-14">
          <h2 className="font-display text-2xl font-black tracking-tight text-ink">
            Выполнение за неделю
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Сегодня выделено цветом — не упусти свой шанс поставить галочку!
          </p>
          <div className="mt-5">
            <WeekCalendar habits={habits} />
          </div>
        </Reveal>

        {/* Быстрая статистика */}
        <Reveal className="mt-14">
          <h2 id="stats" className="scroll-mt-24 font-display text-2xl font-black tracking-tight text-ink">
            Быстрая статистика
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Обзор твоего дня: главные цифры в одном месте.
          </p>
          <div className="mt-5">
            <QuickStats habits={habits} />
          </div>
        </Reveal>
      </main>

      {/* Модалки */}
      <CheckInModal habit={checking} onClose={() => setChecking(null)} onLog={log} />
      {formOpen && (
        <HabitFormModal
          open={formOpen}
          title="Новая привычка"
          initial={null}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}