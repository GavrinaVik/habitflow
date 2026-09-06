import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Confetti from "./Confetti";
import type { Habit } from "../../lib/types";
import { motivationFor } from "../../data/motivation";

type Step = "confirm" | "input" | "done";

interface CheckInModalProps {
  habit: Habit | null;
  onClose: () => void;
  /** Вызвать POST /api/habits/:id/log */
  onLog: (id: string, value: number) => Promise<unknown>;
}

interface CheckInFlowProps {
  habit: Habit;
  onClose: () => void;
  onLog: (id: string, value: number) => Promise<unknown>;
}

const clampPercent = (current: number, target: number) =>
  Math.max(0, Math.min(100, Math.round((current / target) * 100)));

/**
 * Модалка отметки выполнения.
 *
 * Сценарий 1 «Сделал»: подтверждение «Да, выполнил» → 100%, конфетти и фраза.
 * «Не совсем» → Сценарий 2: ввод реального числа → система считает %,
 * прогресс частичный, мотивационная фраза и кнопка «Сохранить».
 */
export default function CheckInModal({ habit, onClose, onLog }: CheckInModalProps) {
  return (
    <Modal open={Boolean(habit)} onClose={onClose} title="Отметка привычки">
      {habit && (
        /* key пересоздаёт поток отметки при открытии другой привычки */
        <CheckInFlow key={habit.id} habit={habit} onClose={onClose} onLog={onLog} />
      )}
    </Modal>
  );
}

function CheckInFlow({ habit, onClose, onLog }: CheckInFlowProps) {
  const [step, setStep] = useState<Step>("confirm");
  const [raw, setRaw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [burst, setBurst] = useState(0);
  const [result, setResult] = useState<{ percent: number; phrase: string } | null>(null);

  const target = habit.target;
  const liveValue = Math.max(0, Number(raw) || 0);
  const livePercent = clampPercent(liveValue, target);

  const finish = (value: number) => {
    const percent = clampPercent(value, target);
    setResult({
      percent,
      phrase:
        percent >= 100
          ? motivationFor(100, `${habit.id}-done-${Date.now()}`)
          : motivationFor(percent, `${habit.id}-part-${Date.now()}`),
    });
    if (percent >= 100) setBurst((b) => b + 1); // конфетти на полном выполнении
    setStep("done");
  };

  // Сценарий 1: полностью выполнил
  const confirmDone = async () => {
    setSubmitting(true);
    setError("");
    try {
      await onLog(habit.id, target);
      finish(target);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSubmitting(false);
    }
  };

  // Сценарий 2: сохранить реальное значение
  const savePartial = async () => {
    const parsed = Number(raw);
    if (!raw || !Number.isFinite(parsed) || parsed < 0) {
      setError("Введите число — сколько вы сделали");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onLog(habit.id, parsed);
      finish(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "done" && result) {
    return (
      <div className="relative text-center">
        {burst > 0 && <Confetti burst={burst} />}
        <p className="text-4xl" aria-hidden="true">
          {result.percent >= 100 ? "🎉" : "💪"}
        </p>
        <p className="mt-4 font-display text-2xl font-black text-ink">
          {result.percent >= 100 ? "Ты крут! Так держать!" : `${result.percent}% — прогресс есть!`}
        </p>
        <p className="mt-2 text-ink-soft">{result.phrase}</p>
        <Button className="mt-6 w-full" onClick={onClose}>
          Отлично!
        </Button>
      </div>
    );
  }

  if (step === "input") {
    return (
      <div>
        <p className="text-sm font-semibold text-ink">Сколько на самом деле сделал?</p>
        <div className="mt-3 flex items-end gap-3">
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            autoFocus
            placeholder={`0 — ${target}`}
            className="w-full rounded-btn border border-ink/10 bg-canvas px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
          />
          <span className="text-sm font-semibold text-ink-soft">{habit.unit}</span>
        </div>

        {/* Предпросмотр процента */}
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ink-soft">Прогресс:</span>
            <span className="font-display text-2xl font-black text-ink">{livePercent}%</span>
          </div>
          <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-canvas">
            <div
              className={`habit-progress h-full rounded-full ${
                livePercent >= 100 ? "bg-primary" : "bg-accent"
              }`}
              style={{ width: `${livePercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-faint">
            {livePercent >= 100
              ? "Цель достигнута!"
              : `До цели ещё ${target - liveValue} ${habit.unit} — и это уже отличное начало!`}
          </p>
        </div>

        {error && (
          <p
            className="mt-3 rounded-btn border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-6 space-y-2.5">
          <Button className="w-full" loading={submitting} onClick={savePartial}>
            Сохранить
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose} disabled={submitting}>
            Отмена
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-lg font-bold text-ink">Отлично! Ты выполнил план? 🤩</p>
      <p className="mt-1 text-sm text-ink-soft">
        Цель — {target} {habit.unit}. Отметим как полностью выполненное?
      </p>
      <div className="mt-6 space-y-2.5">
        <Button className="w-full" loading={submitting} onClick={confirmDone}>
          Да, выполнил ✅
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setStep("input")}
          disabled={submitting}
        >
          Не совсем
        </Button>
      </div>
    </div>
  );
}