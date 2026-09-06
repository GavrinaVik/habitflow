import { useState } from "react";
import type { HabitDay } from "../../../lib/types";

const DAY_SHORT = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });
const DAY_FULL = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const NUM = new Intl.NumberFormat("ru-RU");

interface HabitChartProps {
  series: HabitDay[];
  /** Акцентный цвет привычки (линия графика) */
  color?: string;
  unit: string;
}

const W = 640;
const H = 260;
const PAD = { l: 42, r: 16, t: 20, b: 30 };
const plotW = W - PAD.l - PAD.r;
const plotH = H - PAD.t - PAD.b;

const fmtDate = (iso: string) => DAY_SHORT.format(new Date(`${iso}T00:00:00`));
const fmtDateFull = (iso: string) => DAY_FULL.format(new Date(`${iso}T00:00:00`));

const barColor = (s: HabitDay): string =>
  s.fact >= s.plan && s.fact > 0 ? "bg-primary" : s.fact > 0 ? "bg-accent" : "bg-ink/10";

/**
 * График прогресса:
 * — линейный график % выполнения с зонами (зелёная >80%, оранжевая 50–80%, красная <50%),
 *   точками и тултипом при наведении, с анимацией прорисовки линии;
 * — гистограмма под графиком: зелёный = выполнил план, оранжевый = частично, серый = не делал.
 */
export default function HabitChart({ series, color = "#10b981", unit }: HabitChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const n = series.length;

  const x = (i: number) => (n > 1 ? PAD.l + (i / (n - 1)) * plotW : PAD.l + plotW / 2);
  const y = (pct: number) => PAD.t + plotH - (pct / 100) * plotH;

  const linePath = series
    .map((s, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(s.percent).toFixed(1)}`)
    .join(" ");

  // Метки оси X: не чаще ~8 дат
  const step = Math.max(1, Math.ceil(n / 8));
  const xLabels = series.map((s, i) => ({ i, s })).filter(({ i }) => i % step === 0 || i === n - 1);

  const hovered = hover !== null ? series[hover] : null;

  return (
    <div className="chart-rise">
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full"
          role="img"
          aria-label="График прогресса выполнения"
        >
          {/* Зоны: зелёная (>80%), оранжевая (50–80%), красная (<50%) */}
          <rect x={PAD.l} y={y(100)} width={plotW} height={Math.abs(y(100) - y(80))} fill="rgba(16,185,129,0.07)" />
          <rect x={PAD.l} y={y(80)} width={plotW} height={Math.abs(y(80) - y(50))} fill="rgba(245,158,11,0.08)" />
          <rect x={PAD.l} y={y(50)} width={plotW} height={Math.abs(y(50) - y(0))} fill="rgba(239,68,68,0.06)" />

          {/* Границы зон */}
          {[50, 80].map((p) => (
            <line
              key={p}
              x1={PAD.l}
              x2={PAD.l + plotW}
              y1={y(p)}
              y2={y(p)}
              stroke="rgba(31,41,55,0.15)"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          ))}

          {/* Сетка Y */}
          {[0, 25, 50, 75, 100].map((p) => (
            <g key={p}>
              <line x1={PAD.l} x2={PAD.l + plotW} y1={y(p)} y2={y(p)} stroke="rgba(31,41,55,0.06)" strokeWidth={1} />
              <text x={PAD.l - 7} y={y(p) + 3} textAnchor="end" fontSize={10} fontWeight={700} fill="#9ca3af">
                {p}
              </text>
            </g>
          ))}

          {/* Метки дат на оси X */}
          {xLabels.map(({ i, s }) => (
            <text key={s.date} x={x(i)} y={H - 8} textAnchor="middle" fontSize={10} fontWeight={700} fill="#9ca3af">
              {fmtDate(s.date)}
            </text>
          ))}

          {/* Линия прогресса (pathLength=100 → анимация прорисовки) */}
          <path
            d={linePath}
            className="chart-line"
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            pathLength={100}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Точки на линии с тултипом */}
          {series.map((s, i) => (
            <g key={s.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <circle cx={x(i)} cy={y(s.percent)} r={12} fill="transparent" />
              <circle cx={x(i)} cy={y(s.percent)} r={4.5} fill="#fff" stroke={color} strokeWidth={2.5} />
            </g>
          ))}
        </svg>

        {hovered && hover !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-btn bg-ink px-3 py-2 text-xs text-white shadow-lift"
            style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(hovered.percent) / H) * 100}%`, transform: "translate(-50%, -135%)" }}
          >
            <p className="font-black">{fmtDateFull(hovered.date)}</p>
            <p className="mt-0.5 whitespace-nowrap text-white/70">
              план: {NUM.format(hovered.plan)} · факт: {NUM.format(hovered.fact)} {unit}
            </p>
            <p
              className="mt-0.5 font-black"
              style={{
                color: hovered.percent >= 80 ? "#34d399" : hovered.percent >= 50 ? "#fbbf24" : "#f87171",
              }}
            >
              {hovered.percent}%
            </p>
          </div>
        )}
      </div>

      {/* Гистограмма: выполнение по дням */}
      <div className="mt-5">
        <div className="flex h-20 items-end gap-[3px]">
          {series.map((s) => (
            <div key={s.date} className="flex-1" title={`${fmtDateFull(s.date)}: ${s.percent}%`}>
              <div
                className={`w-full rounded-t-sm transition-colors ${barColor(s)}`}
                style={{ height: `${Math.max(s.percent, s.percent > 0 ? 10 : 3)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-ink-soft">
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-sm bg-primary" aria-hidden="true" /> Выполнил план
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-sm bg-accent" aria-hidden="true" /> Частично
          </span>
          <span className="flex items-center gap-1.5">
            <i className="h-2.5 w-2.5 rounded-sm bg-ink/10" aria-hidden="true" /> Не делал
          </span>
        </div>
      </div>
    </div>
  );
}