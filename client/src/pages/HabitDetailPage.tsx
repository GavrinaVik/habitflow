import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import CheckInModal from "../components/dashboard/CheckInModal";
import HabitFormModal from "../components/dashboard/HabitFormModal";
import HabitSettings from "../components/dashboard/HabitSettings";
import HistoryTable from "../components/dashboard/HistoryTable";
import ShareModal from "../components/dashboard/ShareModal";
import PeriodTabs from "../components/dashboard/chart/PeriodTabs";
import HabitChart from "../components/dashboard/chart/HabitChart";
import StatsGrid from "../components/dashboard/chart/StatsGrid";
import { useAuth } from "../lib/auth";
import { frequencyLabel, periodStats, seriesFor, useHabits } from "../hooks/useHabits";
import type { HabitHistoryPage, HabitInput, HabitPatch, HabitPeriod } from "../lib/types";

/**
 * Детальная страница привычки:
 * header (назад, название, редактировать/удалить), настройки, график прогресса
 * с периодами и статистикой, история выполнения (пагинация + CSV),
 * и кнопка «Поделиться прогрессом» с генерацией картинки 1080×1920.
 */
export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { habits, loading, log, update, remove, history } = useHabits();

  const [checking, setChecking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [period, setPeriod] = useState<HabitPeriod>("week");
  const [page, setPage] = useState(1);
  const [historyData, setHistoryData] = useState<HabitHistoryPage | null>(null);

  const habit = habits.find((h) => h.id === id);
  const plan = user?.plan ?? "free";
  const isPro = plan !== "free";

  // Точки графика и статистика зависят от выбранного периода — пересчитываются динамически
  const series = useMemo(() => (habit ? seriesFor(habit, period) : []), [habit, period]);
  const stats = useMemo(() => periodStats(series), [series]);

  // История с пагинацией
  useEffect(() => {
    let active = true;
    if (habit) {
      setHistoryData(null);
      history(habit.id, page)
        .then((d) => {
          if (active) setHistoryData(d);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit?.id, page]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/login?next=/dashboard" replace />;

  if (loading) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-4">
        <p className="animate-pulse font-display text-lg font-bold text-ink-soft">Загрузка…</p>
      </main>
    );
  }

  if (!habit) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Card className="p-10 text-center">
          <p className="text-4xl" aria-hidden="true">🤔</p>
          <h1 className="mt-4 font-display text-2xl font-black text-ink">Привычка не найдена</h1>
          <Button to="/dashboard" className="mt-6">
            ← В личный кабинет
          </Button>
        </Card>
      </main>
    );
  }

  const refreshHistory = () => {
    history(habit.id, page).then(setHistoryData).catch(() => {});
  };

  const handleLogDone = async (habitId: string, value: number) => {
    await log(habitId, value);
    setChecking(false);
    refreshHistory();
  };

  const handleSaveSettings = async (patch: HabitPatch) => {
    setSavingSettings(true);
    try {
      await update(habit.id, patch);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveEdit = async (input: HabitInput) => {
    await update(habit.id, input);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await remove(habit.id);
      navigate("/dashboard");
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    if (!habit) return;
    setExporting(true);
    try {
      const res = await fetch(`/api/habits/${habit.id}/export`);
      if (!res.ok) throw new Error("Ошибка экспорта");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `habit-${habit.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* тихо игнорируем ошибку экспорта */
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        to="/dashboard"
        className="text-sm font-bold text-primary transition-colors hover:text-primary-dark"
      >
        ← Назад к привычкам
      </Link>

      {/* 1. Header */}
      <Card className="mt-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span
              className="grid h-16 w-16 shrink-0 place-items-center text-4xl"
              style={{ backgroundColor: `${habit.color}1f`, borderRadius: 18 }}
              aria-hidden="true"
            >
              {habit.emoji}
            </span>
            <div>
              <h1 className="font-display text-3xl font-black tracking-tight text-ink">
                {habit.target} {habit.unit}
              </h1>
              <p className="mt-0.5 text-sm font-semibold text-ink-soft">
                {habit.name} · {frequencyLabel(habit.frequency)}
                {habit.reminderTime ? ` · напоминание ${habit.reminderTime}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setChecking(true)} data-metrica="goal:habit-checkin">
              ✅ Отметить сегодня
            </Button>
            <Button variant="outline" onClick={() => setEditing(true)}>
              Редактировать
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmingDelete(true)}
              className="text-red-500"
            >
              Удалить
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Настройки привычки */}
      <section className="mt-8" aria-label="Настройки привычки">
        <HabitSettings key={habit.id} habit={habit} saving={savingSettings} onSave={handleSaveSettings} />
      </section>

      {/* 3. График прогресса */}
      <section className="mt-8" aria-label="График прогресса">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-black tracking-tight text-ink">
            График прогресса
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <PeriodTabs value={period} onChange={setPeriod} plan={plan} />
            <Button variant="outline" onClick={() => setSharing(true)} className="text-xs">
              Поделиться прогрессом ↗
            </Button>
          </div>
        </div>

        {!isPro && (
          <p className="mt-3 rounded-card border border-ink/5 bg-accent-soft px-4 py-2.5 text-sm font-semibold text-accent-dark">
            Периоды «Месяц» и «Всё время», а также экспорт CSV доступны на{` `}
            <Link to="/pricing" className="font-black underline decoration-2 underline-offset-2">
              тарифе Pro
            </Link>
            .
          </p>
        )}

        <Card className="mt-4 p-6">
          {series.length === 0 ? (
            <p className="py-10 text-center text-sm font-semibold text-ink-faint">
              Пока нет данных для графика
            </p>
          ) : (
            <HabitChart key={period} series={series} color={habit.color} unit={habit.unit} />
          )}
        </Card>

        {/* Статистика за период */}
        <div className="mt-5">
          {stats.total === 0 ? (
            <p className="rounded-card border border-ink/5 bg-white px-4 py-3 text-sm text-ink-faint">
              Отметьте выполнение, чтобы увидеть статистику за этот период.
            </p>
          ) : (
            <StatsGrid stats={stats} />
          )}
        </div>
      </section>

      {/* 4. История выполнения */}
      <section className="mt-10" aria-label="История выполнения">
        <HistoryTable
          habit={habit}
          data={historyData}
          onPage={setPage}
          plan={plan}
          exporting={exporting}
          onExport={handleExport}
        />
      </section>

      {/* 5. Поделиться */}
      <ShareModal open={sharing} onClose={() => setSharing(false)} habit={habit} series={series} stats={stats} />

      {/* Модалки: отметка, редактирование, удаление */}
      <CheckInModal habit={checking ? habit : null} onClose={() => setChecking(false)} onLog={handleLogDone} />
      {editing && (
        <HabitFormModal
          open={editing}
          title="Редактировать привычку"
          initial={habit}
          onClose={() => setEditing(false)}
          onSave={handleSaveEdit}
        />
      )}
      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Удалить привычку?"
      >
        <p className="text-sm font-medium text-ink-soft">
          Привычка «{habit.name}» и вся её история будут удалены безвозвратно.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmingDelete(false)}>
            Отмена
          </Button>
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
    </main>
  );
}