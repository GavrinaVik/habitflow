import { useState } from "react";
import type { Habit, HabitPatch } from "../../lib/types";
import Button from "../ui/Button";
import { frequencyLabel } from "../../hooks/useHabits";

const UNIT_OPTIONS = [
  "раз",
  "минут",
  "страниц",
  "стаканов",
  "шагов",
  "приседаний",
  "километров",
  "порций",
];

const FREQUENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "daily", label: "Ежедневно" },
  { value: "every-other", label: "Через день" },
  { value: "3x", label: "3 раза в неделю" },
  { value: "5x", label: "5 раз в неделю" },
];

interface HabitSettingsProps {
  habit: Habit;
  saving: boolean;
  /** Сохранить настройки — PUT /api/habits/:id */
  onSave: (patch: HabitPatch) => Promise<void>;
}

/** Настройки привычки: цель, единицы, частота, время напоминания */
export default function HabitSettings({ habit, saving, onSave }: HabitSettingsProps) {
  const [target, setTarget] = useState(String(habit.target));
  const [unit, setUnit] = useState(habit.unit);
  const [frequency, setFrequency] = useState(habit.frequency);
  const [reminderTime, setReminderTime] = useState(habit.reminderTime ?? "");

  const units = UNIT_OPTIONS.includes(habit.unit)
    ? UNIT_OPTIONS
    : [habit.unit, ...UNIT_OPTIONS.filter((u) => u !== habit.unit)];
  const frequencies = FREQUENCY_OPTIONS.some((f) => f.value === habit.frequency)
    ? FREQUENCY_OPTIONS
    : [
        { value: habit.frequency, label: frequencyLabel(habit.frequency) },
        ...FREQUENCY_OPTIONS.filter((f) => f.value !== habit.frequency),
      ];

  const targetNum = Number(target);
  const invalid = !Number.isFinite(targetNum) || targetNum <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid) return;
    await onSave({
      target: targetNum,
      unit,
      frequency,
      reminderTime: reminderTime.trim() ? reminderTime : null,
    });
  };

  const labelClass = "block text-xs font-black uppercase tracking-wide text-ink-faint";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-card border border-ink/5 bg-white p-6 shadow-soft"
      aria-label="Настройки привычки"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl font-black tracking-tight text-ink">Настройки привычки</h2>
        <p className="text-xs font-bold text-ink-faint">{habit.emoji} {habit.name}</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="habit-target" className={labelClass}>Целевое значение</label>
          <input
            id="habit-target"
            type="number"
            min={1}
            step={1}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className={`mt-2 w-full rounded-btn border px-4 py-2.5 text-sm font-bold text-ink outline-none transition-all focus:ring-2 ${
              invalid
                ? "border-red-300 focus:ring-red-300"
                : "border-ink/10 focus:border-primary focus:ring-primary/20"
            }`}
            aria-label="Целевое значение"
          />
        </div>

        <div>
          <label htmlFor="habit-unit" className={labelClass}>Единица измерения</label>
          <select
            id="habit-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-2 w-full rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-bold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {units.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="habit-frequency" className={labelClass}>Частота</label>
          <select
            id="habit-frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="mt-2 w-full rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-bold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {frequencies.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="habit-reminder" className={labelClass}>Время напоминания</label>
          <input
            id="habit-reminder"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="mt-2 w-full rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-bold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            aria-label="Время напоминания"
          />
          <p className="mt-1 text-[11px] font-semibold text-ink-faint">Необязательно</p>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="submit" loading={saving} disabled={invalid} className="text-xs">
          Сохранить изменения
        </Button>
      </div>
    </form>
  );
}