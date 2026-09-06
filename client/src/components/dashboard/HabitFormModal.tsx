import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import type { HabitInput } from "../../lib/types";

const EMOJIS = ["⭐", "💪", "🏃", "📚", "💧", "🧘", "🥗", "😴", "✍️", "🎯", "🦷", "🚶", "🧹", "💻", "🎸", "🌅"];

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#ef4444"];

interface HabitFormModalProps {
  open: boolean;
  title: string;
  /** Значения для редактирования; null — создание */
  initial?: HabitInput | null;
  onClose: () => void;
  onSave: (input: HabitInput) => Promise<unknown>;
}

/** Создание или редактирование привычки: имя, цель, единицы, эмодзи, цвет */
export default function HabitFormModal({ open, title, initial, onClose, onSave }: HabitFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? EMOJIS[0]);
  const [target, setTarget] = useState(String(initial?.target ?? ""));
  const [unit, setUnit] = useState(initial?.unit ?? "раз");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [errors, setErrors] = useState<{ name?: string; target?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const e: { name?: string; target?: string } = {};
    if (name.trim().length < 2) e.name = "Введите название привычки";
    const parsedTarget = Number(target);
    if (!target || !Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      e.target = "Укажите цель (число больше 0)";
    }
    setErrors(e);
    if (e.name || e.target) return;

    setSubmitting(true);
    try {
      await onSave({ name: name.trim(), emoji, target: parsedTarget, unit: unit.trim() || "раз", color });
      onClose();
    } catch (err) {
      setErrors({ name: err instanceof Error ? err.message : "Не удалось сохранить" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <div className="space-y-4">
        <div>
          <label htmlFor="h-name" className="mb-1 block text-sm font-semibold text-ink">
            Название
          </label>
          <input
            id="h-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, 50 приседаний"
            className={`w-full rounded-btn border bg-canvas px-4 py-2.5 text-sm outline-none transition-colors ${
              errors.name ? "border-red-400" : "border-ink/10 focus:border-primary"
            }`}
          />
          {errors.name && <p className="mt-1.5 text-sm font-medium text-red-500">{errors.name}</p>}
        </div>

        {/* Выбор эмодзи */}
        <div>
          <p className="mb-1 text-sm font-semibold text-ink">Иконка</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Иконка привычки">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                role="radio"
                aria-checked={emoji === e}
                onClick={() => setEmoji(e)}
                className={`grid h-10 w-10 place-items-center rounded-btn text-xl transition-all ${
                  emoji === e
                    ? "bg-primary-soft shadow-soft ring-2 ring-primary"
                    : "bg-canvas hover:bg-ink/5"
                }`}
                aria-label={`Эмодзи ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="h-target" className="mb-1 block text-sm font-semibold text-ink">
              Цель за день
            </label>
            <input
              id="h-target"
              type="number"
              inputMode="numeric"
              min={1}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="50"
              className={`w-full rounded-btn border bg-canvas px-4 py-2.5 text-sm outline-none transition-colors ${
                errors.target ? "border-red-400" : "border-ink/10 focus:border-primary"
              }`}
            />
            {errors.target && (
              <p className="mt-1.5 text-sm font-medium text-red-500">{errors.target}</p>
            )}
          </div>
          <div>
            <label htmlFor="h-unit" className="mb-1 block text-sm font-semibold text-ink">
              Единицы
            </label>
            <input
              id="h-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="приседаний, минут, страниц…"
              className="w-full rounded-btn border border-ink/10 bg-canvas px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
        </div>

        {/* Палитра цвета */}
        <div>
          <p className="mb-1 text-sm font-semibold text-ink">Цвет</p>
          <div className="flex gap-2.5" role="radiogroup" aria-label="Цвет привычки">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-full transition-transform hover:scale-110 ${
                  color === c ? "ring-2 ring-ink ring-offset-2" : ""
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Цвет ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <Button className="w-full" loading={submitting} onClick={handleSubmit}>
            {initial ? "Сохранить" : "Создать привычку"}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose} disabled={submitting}>
            Отмена
          </Button>
        </div>
      </div>
    </Modal>
  );
}