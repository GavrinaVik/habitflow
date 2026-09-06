import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { getAdminSettings, updateAdminSettings } from "../../lib/adminApi";
import type { AdminSettings, EmailTemplate } from "../../lib/types";

const VARS_HINT = ["{{имя}}", "{{тариф}}", "{{ссылка}}" ];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tplId, setTplId] = useState("");

  useEffect(() => {
    getAdminSettings().then((s) => { setSettings(s); setTplId(s.emailTemplates[0]?.id ?? ""); })
      .catch((e) => setError(e.message));
  }, []);

  const setPrices = (k: keyof AdminSettings["prices"]) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings((s) => s ? { ...s, prices: { ...s.prices, [k]: Number(e.target.value) } } : s);
  };

  const setTpl = (id: string) => (patch: Partial<EmailTemplate>) => {
    setSettings((s) => s ? { ...s, emailTemplates: s.emailTemplates.map((t) => (t.id === id ? { ...t, ...patch } : t)) } : s);
  };

  const save = async () => {
    if (!settings) return;
    setBusy(true);
    setError("");
    try {
      await updateAdminSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setBusy(false);
    }
  };

  if (!settings) return <p className="animate-pulse text-sm font-bold text-ink-soft">Загружаем настройки…</p>;

  const tpl = settings.emailTemplates.find((t) => t.id === tplId) ?? settings.emailTemplates[0];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-ink">Настройки сервиса</h1>
          <p className="text-sm text-ink-soft">Цены, реклама, оферта и шаблоны писем</p>
        </div>
        <Button onClick={save} disabled={busy}>
          {busy ? "Сохраняем…" : saved ? "✓ Сохранено" : "Сохранить"}
        </Button>
      </div>

      {error && <p className="mt-4 rounded-card bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-display text-lg font-extrabold text-ink">Цены подписок, ₽/мес</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <PriceField label="Pro, помесячно" value={settings.prices.proMonthly} onChange={setPrices("proMonthly")} />
            <PriceField label="Pro, год (за месяц)" value={settings.prices.proYearly} onChange={setPrices("proYearly")} />
            <PriceField label="Premium, помесячно" value={settings.prices.premiumMonthly} onChange={setPrices("premiumMonthly")} />
            <PriceField label="Premium, год (за месяц)" value={settings.prices.premiumYearly} onChange={setPrices("premiumYearly")} />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-extrabold text-ink">Реклама и безопасность</h2>
          <label className="mt-4 flex items-center justify-between gap-4 rounded-card border border-ink/10 p-4">
            <span>
              <span className="block text-sm font-bold text-ink">Показывать рекламу Free-пользователям</span>
              <span className="text-xs text-ink-faint">Мотивационные блоки на главной</span>
            </span>
            <input
              type="checkbox"
              checked={settings.adsForFree}
              onChange={(e) => setSettings((s) => (s ? { ...s, adsForFree: e.target.checked } : s))}
              className="h-5 w-5 accent-emerald-500"
            />
          </label>
          <div className="mt-3 flex items-center justify-between gap-4 rounded-card border border-ink/10 p-4 opacity-60">
            <span>
              <span className="block text-sm font-bold text-ink">Двухфакторная авторизация для админов</span>
              <span className="text-xs text-ink-faint">Опционально по ТЗ — станет доступно в следующем релизе</span>
            </span>
            <input type="checkbox" disabled className="h-5 w-5" />
          </div>
          <label className="mt-4 block text-xs font-black uppercase tracking-wide text-ink-faint">Текст публичной оферты</label>
          <textarea
            value={settings.offerText}
            onChange={(e) => setSettings((s) => (s ? { ...s, offerText: e.target.value } : s))}
            rows={3}
            className="mt-2 w-full resize-none rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary"
          />
          <label className="mt-3 block text-xs font-black uppercase tracking-wide text-ink-faint">Политика конфиденциальности</label>
          <textarea
            value={settings.privacyText}
            onChange={(e) => setSettings((s) => (s ? { ...s, privacyText: e.target.value } : s))}
            rows={3}
            className="mt-2 w-full resize-none rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary"
          />
        </Card>
      </div>

      <Card className="mt-5 p-6">
        <h2 className="font-display text-lg font-extrabold text-ink">Шаблоны писем</h2>
        <p className="mt-1 text-xs text-ink-faint">
          Доступные переменные:{" "}
          {VARS_HINT.map((v) => (
            <code key={v} className="ml-1 rounded bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold text-primary-deep">{v}</code>
          ))}
        </p>
        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          <div className="space-y-1.5">
            {settings.emailTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTplId(t.id)}
                className={`block w-full rounded-btn px-4 py-2.5 text-left text-sm font-bold transition-colors ${
                  tplId === t.id ? "bg-primary text-white shadow-soft" : "bg-canvas text-ink-soft hover:text-ink"
                }`}
              >
                📧 {t.name}
              </button>
            ))}
          </div>
          {tpl ? (
            <div className="lg:col-span-2">
              <label className="block text-xs font-black uppercase tracking-wide text-ink-faint">Тема</label>
              <input
                value={tpl.subject}
                onChange={(e) => setTpl(tpl.id)({ subject: e.target.value })}
                className="mt-2 w-full rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary"
              />
              <label className="mt-4 block text-xs font-black uppercase tracking-wide text-ink-faint">Текст</label>
              <textarea
                value={tpl.body}
                onChange={(e) => setTpl(tpl.id)({ body: e.target.value })}
                rows={7}
                className="mt-2 w-full resize-none rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary"
              />
              <div className="mt-4 flex justify-end">
                <Button onClick={save} disabled={busy}>{saved ? "✓ Сохранено" : "Сохранить"}</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-faint lg:col-span-2">Шаблонов нет</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function PriceField({ label, value, onChange }: { label: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className="block text-xs font-bold text-ink-soft">{label}</label>
      <input
        type="number"
        min={0}
        value={value}
        onChange={onChange}
        className="mt-1.5 w-full rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-black text-ink outline-none focus:border-primary"
      />
    </div>
  );
}