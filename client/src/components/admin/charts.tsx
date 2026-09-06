import { useState } from "react";

const NUM = new Intl.NumberFormat("ru-RU");
const DAY_SHORT = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" });

const PLAN_COLORS: Record<string, string> = {
  free: "#9ca3af",
  pro: "#10b981",
  premium: "#8b5cf6",
};

/** Линейный график: регистрации по дням */
export function AdminLineChart({ data }: { data: { date: string; count: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 220;
  const PAD = { l: 30, r: 12, t: 14, b: 24 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const n = data.length;
  const max = Math.max(1, ...data.map((d) => d.count));
  const x = (i: number) => (n > 1 ? PAD.l + (i / (n - 1)) * plotW : PAD.l + plotW / 2);
  const y = (v: number) => PAD.t + plotH - (v / max) * plotH;
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(d.count).toFixed(1)}`).join(" ");
  const area = `${path} L${x(n - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const step = Math.max(1, Math.ceil(n / 8));
  const hovered = hover !== null ? data[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Регистрации за 30 дней">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={PAD.l} x2={PAD.l + plotW} y1={y(max * f)} y2={y(max * f)} stroke="rgba(31,41,55,0.06)" />
            <text x={PAD.l - 6} y={y(max * f) + 3} textAnchor="end" fontSize={10} fontWeight={700} fill="#9ca3af">
              {Math.round(max * f)}
            </text>
          </g>
        ))}
        <path d={area} fill="rgba(16,185,129,0.12)" />
        <path d={path} className="chart-line" fill="none" stroke="#10b981" strokeWidth={2.5} pathLength={100} strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
            <circle cx={x(i)} cy={y(d.count)} r={10} fill="transparent" />
            <circle cx={x(i)} cy={y(d.count)} r={3.5} fill="#fff" stroke="#10b981" strokeWidth={2} />
          </g>
        ))}
        {data.map((d, i) =>
          i % step === 0 || i === n - 1 ? (
            <text key={`t${d.date}`} x={x(i)} y={H - 7} textAnchor="middle" fontSize={9} fontWeight={700} fill="#9ca3af">
              {DAY_SHORT.format(new Date(`${d.date}T00:00:00`))}
            </text>
          ) : null
        )}
      </svg>
      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-btn bg-ink px-3 py-1.5 text-xs font-bold text-white shadow-lift"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(hovered.count) / H) * 100}%`, transform: "translate(-50%, -135%)" }}
        >
          {DAY_SHORT.format(new Date(`${hovered.date}T00:00:00`))}: {hovered.count}
        </div>
      )}
    </div>
  );
}

/** Круговая диаграмма: распределение по тарифам */
export function AdminDonut({ data }: { data: { plan: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const C = 2 * Math.PI * 54;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0" role="img" aria-label="Распределение по тарифам">
        <circle cx="70" cy="70" r="54" fill="none" stroke="rgba(31,41,55,0.08)" strokeWidth="18" />
        {total > 0 &&
          data.map((d) => {
            const frac = d.count / total;
            const dash = frac * C;
            const seg = (
              <circle
                key={d.plan}
                cx="70"
                cy="70"
                r="54"
                fill="none"
                stroke={PLAN_COLORS[d.plan] ?? "#9ca3af"}
                strokeWidth="18"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 70 70)"
              />
            );
            offset += dash;
            return seg;
          })}
        <text x="70" y="66" textAnchor="middle" fontSize="22" fontWeight="900" fill="#1f2937">
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" fontSize="10" fontWeight="700" fill="#9ca3af">
          всего
        </text>
      </svg>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.plan} className="flex items-center gap-2 text-sm">
            <i className="h-3 w-3 rounded-full" style={{ backgroundColor: PLAN_COLORS[d.plan] ?? "#9ca3af" }} aria-hidden="true" />
            <span className="font-bold text-ink capitalize">{d.plan}</span>
            <span className="ml-auto font-black text-ink">{d.count}</span>
            <span className="w-12 text-right text-xs font-bold text-ink-faint">
              {total ? Math.round((d.count / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Столбчатый график: оплаты за 12 месяцев */
export function AdminBarsChart({ data }: { data: { month: string; total: number; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div>
      <div className="flex h-44 items-end gap-2">
        {data.map((d) => (
          <div key={d.month} className="group flex flex-1 flex-col items-center gap-1" title={`${d.month}: ${NUM.format(d.total)} ₽ (${d.count})`}>
            <span className="text-[9px] font-bold text-ink-faint opacity-0 transition-opacity group-hover:opacity-100">
              {Math.round(d.total / 1000)}к
            </span>
            <div
              className="w-full rounded-t-md bg-primary transition-colors group-hover:bg-primary-dark"
              style={{ height: `${Math.max((d.total / max) * 100, 3)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d) => (
          <span key={d.month} className="flex-1 text-center text-[9px] font-bold text-ink-faint">
            {d.month}
          </span>
        ))}
      </div>
    </div>
  );
}