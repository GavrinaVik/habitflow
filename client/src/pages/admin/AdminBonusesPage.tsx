import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { createBonus, deleteBonus, getBonuses, updateBonus } from "../../lib/adminApi";
import type { PartnerBonus } from "../../lib/types";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ru-RU");

function BonusForm({ item, onClose, onSave }: { item: PartnerBonus | null; onClose: () => void; onSave: (b: Omit<PartnerBonus, "id">) => void }) {
  const blank = { name: "", description: "", link: "", promoCode: "", expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) };
  const [form, setForm] = useState<Omit<PartnerBonus, "id">>(
    item
      ? { name: item.name, description: item.description, link: item.link, promoCode: item.promoCode, expiresAt: item.expiresAt.slice(0, 10) }
      : blank
  );
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.promoCode.trim()) return;
        setBusy(true);
        onSave({ ...form, expiresAt: new Date(`${form.expiresAt}T00:00:00`).toISOString() });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-black uppercase tracking-wide text-ink-faint">Название</label>
          <input value={form.name} onChange={set("name")} placeholder="Skyeng" className="mt-2 w-full rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary" required />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wide text-ink-faint">Промокод</label>
          <input value={form.promoCode} onChange={set("promoCode")} placeholder="HABITFIT-30" className="mt-2 w-full rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary" required />
        </div>
      </div>
      <label className="mt-4 block text-xs font-black uppercase tracking-wide text-ink-faint">Описание</label>
      <textarea value={form.description} onChange={set("description")} rows={2} className="mt-2 w-full resize-none rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-black uppercase tracking-wide text-ink-faint">Ссылка</label>
          <input value={form.link} onChange={set("link")} type="url" placeholder="https://…" className="mt-2 w-full rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary" required />
        </div>
        <div>
          <label className="block text-xs font-black uppercase tracking-wide text-ink-faint">Действует до</label>
          <input value={form.expiresAt} onChange={set("expiresAt")} type="date" className="mt-2 w-full rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary" required />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>Отмена</Button>
        <Button type="submit" disabled={busy || !form.name.trim() || !form.promoCode.trim()}>Сохранить</Button>
      </div>
    </form>
  );
}

export default function AdminBonusesPage() {
  const [data, setData] = useState<PartnerBonus[]>([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<PartnerBonus | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<PartnerBonus | null>(null);

  const reload = () => {
    getBonuses().then(setData).catch((e) => setError(e.message));
  };

  useEffect(() => {
    reload();
  }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-ink">Бонусы партнёров</h1>
          <p className="text-sm text-ink-soft">Скидки и подарки от партнёров для пользователей Premium</p>
        </div>
        <Button className="text-xs" onClick={() => setModal("new")}>+ Бонус</Button>
      </div>

      {error && <p className="mt-4 rounded-card bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((b) => (
          <Card key={b.id} className="animate-pop p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-lg font-black text-ink">🎁 {b.name}</h2>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-black text-violet-700">{b.promoCode}</span>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{b.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <a href={b.link} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline">
                Перейти на сайт ↗
              </a>
              <span className="text-[11px] font-bold text-ink-faint">до {fmtDate(b.expiresAt)}</span>
            </div>
            <div className="mt-4 flex gap-1.5 border-t border-ink/5 pt-3">
              <Button variant="outline" className="px-2.5 py-1 text-[11px]" onClick={() => setModal(b)}>✏️ Редактировать</Button>
              <Button variant="outline" className="px-2.5 py-1 text-[11px] text-red-500" onClick={() => setDeleteTarget(b)}>🗑️</Button>
            </div>
          </Card>
        ))}
        {data.length === 0 && <p className="text-sm text-ink-faint">Бонусов пока нет</p>}
      </div>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === "new" ? "Новый бонус" : "Редактировать бонус"}>
        {modal !== null && (
          <BonusForm
            item={modal === "new" ? null : modal}
            onClose={() => setModal(null)}
            onSave={async (b) => {
              try {
                if (modal === "new") await createBonus(b);
                else await updateBonus((modal as PartnerBonus).id, b);
                setModal(null);
                reload();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Ошибка сохранения");
              }
            }}
          />
        )}
      </Modal>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Удалить бонус?">
        <p className="text-sm text-ink-soft">Бонус <b className="text-ink">{deleteTarget?.name}</b> будет удалён.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Отмена</Button>
          <button
            type="button"
            onClick={async () => {
              try {
                if (deleteTarget) await deleteBonus(deleteTarget.id);
                setDeleteTarget(null);
                reload();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Ошибка удаления");
              }
            }}
            className="rounded-btn bg-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-colors hover:bg-red-600"
          >
            Удалить
          </button>
        </div>
      </Modal>
    </div>
  );
}