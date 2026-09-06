import type { Habit, HabitDay, PeriodStats } from "./types";

const DAY_FULL = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const NUM = new Intl.NumberFormat("ru-RU");

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

const barColor = (s: HabitDay): string =>
  s.fact >= s.plan && s.fact > 0
    ? "#34d399"
    : s.fact > 0
      ? "#fbbf24"
      : "rgba(255,255,255,0.22)";

/**
 * Рисует карточку прогресса для соцсетей 1080×1920 (Instagram Stories):
 * эмодзи, название и цель привычки, мини-гистограмма за последние дни,
 * ключевые цифры (среднее, лучший день, серия, всего выполнений).
 * Возвращает dataURL PNG.
 */
export function renderShareCard(
  habit: Habit,
  series: HabitDay[],
  stats: PeriodStats
): string {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Фон: тёмно-синий → бирюзовый → зелёный
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0f172a");
  bg.addColorStop(0.5, "#134e4a");
  bg.addColorStop(1, "#10b981");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Декор: полупрозрачные круги
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(W - 120, 220, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(160, H - 320, 300, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Бренд
  ctx.font = "700 44px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("HabitFlow", W / 2, 110);

  // Эмодзи
  ctx.font = "170px 'Segoe UI Emoji', 'Apple Color Emoji', Arial, sans-serif";
  ctx.fillText(habit.emoji, W / 2, 350);

  // Название привычки
  ctx.font = "900 96px Nunito, Arial, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(habit.name, W / 2, 500);

  // Цель
  ctx.font = "600 46px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`Цель: ${NUM.format(habit.target)} ${habit.unit}/день`, W / 2, 600);

  // Мини-гистограмма за последние 14 дней
  const data = series.slice(-14);
  const bw = 46;
  const gap = 16;
  const inner = data.length * (bw + gap);
  const maxH = 400;
  const baseY = 900;
  let bx = (W - inner) / 2 + bw / 2;
  for (const s of data) {
    const h = Math.max(s.percent > 0 ? 14 : 8, (s.percent / 100) * maxH);
    ctx.fillStyle = barColor(s);
    roundRect(ctx, bx - bw / 2, baseY - h, bw, h, 12);
    ctx.fill();
    bx += bw + gap;
  }
  // Базовая линия
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  roundRect(ctx, (W - inner) / 2 - 10, baseY + 4, inner + 20, 4, 2);
  ctx.fill();

  // Статистика
  const rows: { label: string; value: string }[] = [
    { label: "Среднее выполнение", value: `${stats.avg}%` },
    {
      label: "Лучший день",
      value: stats.bestDate ? `${DAY_FULL.format(new Date(`${stats.bestDate}T00:00:00`))}` : "—",
    },
    { label: "Серия дней", value: `${stats.streak} дн` },
    { label: "Всего выполнений", value: `${stats.done} из ${stats.total}` },
  ];
  let ry = 1080;
  ctx.font = "600 42px Arial, sans-serif";
  for (const row of rows) {
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(row.label, 140, ry);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 42px Arial, sans-serif";
    ctx.fillText(row.value, W - 140, ry);
    ctx.font = "600 42px Arial, sans-serif";
    ry += 104;
  }

  // Подпись
  ctx.textAlign = "center";
  ctx.font = "600 38px Arial, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillText("habitflow.app — трекер привычек", W / 2, H - 90);

  return canvas.toDataURL("image/png");
}

/** Скачать PNG-картинку */
export function downloadShareImage(dataUrl: string, name = "habitflow-stories.png"): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  a.click();
}