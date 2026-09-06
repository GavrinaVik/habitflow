import { useEffect, useState } from "react";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import {
  createFaq,
  createMotivation,
  deleteFaq,
  deleteMotivation,
  getFaq,
  getMotivations,
  reorderFaq,
  updateFaq,
  updateMotivation,
} from "../../lib/adminApi";
import type { ContentFaq, Motivation } from "../../lib/types";

const TABS = [
  { id: "phrases", label: "Мотивационные фразы" },
  { id: "faq", label: "FAQ" },
];

function FaqFormModal({ item, onClose, onSave }: { item: ContentFaq | null; onClose: () => void; onSave: (f: Pick<ContentFaq, "question" | "answer">) => void }) {
  const [question, setQuestion] = useState(item?.question ?? "");
  const [answer, setAnswer] = useState(item?.answer ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  return (
    <Modal open onClose={onClose} title={item ? "Редактировать вопрос" : "Новый вопрос"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!question.trim() || !answer.trim()) return;
          setBusy(true);
          setErr("");
          onSave({ question: question.trim(), answer: answer.trim() });
        }}
      >
        <label className="block text-xs font-black uppercase tracking-wide text-ink-faint">Вопрос</label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Например: Как перенести привычку на другой день?"
          className="mt-2 w-full rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
        />
        <label className="mt-4 block text-xs font-black uppercase tracking-wide text-ink-faint">Ответ</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          placeholder="Подробный ответ для пользователей…"
          className="mt-2 w-full resize-none rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          required
        />
        {err && <p className="mt-2 text-sm font-medium text-red-500">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose}>Отмена</Button>
          <Button type="submit" disabled={busy || !question.trim() || !answer.trim()}>Сохранить</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminContentPage() {
  const [tab, setTab] = useState("phrases");
  const [motivations, setMotivations] = useState<Motivation[]>([]);
  const [faq, setFaq] = useState<ContentFaq[]>([]);
  const [error, setError] = useState("");
  const [motifModal, setMotifModal] = useState<Motivation | null | "new">(null);
  const [faqModal, setFaqModal] = useState<ContentFaq | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: "m" | "f"; id: string } | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const reload = () => {
    getMotivations().then(setMotivations).catch((e) => setError(e.message));
    getFaq().then(setFaq).catch((e) => setError(e.message));
  };

  useEffect(() => {
    reload();
  }, []);

  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return;
    const list = [...faq];
    const [moved] = list.splice(dragIdx, 1);
    list.splice(targetIdx, 0, moved);
    setFaq(list);
    setDragIdx(null);
    reorderFaq(list.map((f) => f.id)).catch((e) => setError(e.message));
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-ink">Контент</h1>
          <p className="text-sm text-ink-soft">Фразы на главной и ответы на частые вопросы</p>
        </div>
        <Button className="text-xs" onClick={() => { tab === "phrases" ? setMotifModal("new") : setFaqModal("new"); }}>
          {tab === "phrases" ? "+ Фраза" : "+ Вопрос"}
        </Button>
      </div>

      <div className="mt-4 flex gap-1 rounded-full bg-ink/5 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-black transition-colors ${tab === t.id ? "bg-white text-ink shadow-soft" : "text-ink-faint hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-card bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}

      {tab === "phrases" ? (
        <Card className="mt-4 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/5 text-xs font-black uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3">Эмодзи</th>
                  <th className="px-5 py-3">Текст</th>
                  <th className="px-5 py-3 w-28">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {motivations.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-sm text-ink-faint">Фраз пока нет</td></tr>
                )}
                {motivations.map((m) => (
                  <tr key={m.id} className="hover:bg-canvas">
                    <td className="px-5 py-3 text-xl">{m.emoji}</td>
                    <td className="px-5 py-3 font-semibold text-ink">{m.text}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1.5">
                        <Button variant="outline" className="px-2.5 py-1 text-[11px]" onClick={() => setMotifModal(m)}>✏️</Button>
                        <Button variant="outline" className="px-2.5 py-1 text-[11px] text-red-500" onClick={() => setDeleteTarget({ kind: "m", id: m.id })}>🗑️</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="mt-4 overflow-hidden p-0">
          <div className="divide-y divide-ink/5">
            {faq.length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-faint">Вопросов пока нет</p>}
            {faq.map((f, i) => (
              <div
                key={f.id}
                draggable
                onDragStart={() => setDragIdx(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(i)}
                className={`flex items-start gap-3 px-5 py-4 hover:bg-canvas ${dragIdx === i ? "opacity-50" : ""} ${dragIdx !== null ? "cursor-grab" : ""}`}
              >
                <span className="mt-0.5 text-xl text-ink-faint select-none" aria-hidden="true">⠿</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{f.question}</p>
                  <p className="mt-1 text-sm text-ink-soft">{f.answer}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="outline" className="px-2.5 py-1 text-[11px]" onClick={() => setFaqModal(f)}>✏️</Button>
                  <Button variant="outline" className="px-2.5 py-1 text-[11px] text-red-500" onClick={() => setDeleteTarget({ kind: "f", id: f.id })}>🗑️</Button>
                </div>
              </div>
            ))}
          </div>
          {faq.length > 1 && <p className="border-t border-ink/5 px-5 py-2.5 text-[11px] font-bold text-ink-faint">Перетащите строки, чтобы изменить порядок вопросов</p>}
        </Card>
      )}

      {/* Модалка фразы */}
      <Modal open={motifModal !== null} onClose={() => setMotifModal(null)} title={motifModal === "new" ? "Новая фраза" : "Редактировать фразу"}>
        {motifModal !== null && (
          <MotivationForm
            item={motifModal === "new" ? null : motifModal}
            onClose={() => setMotifModal(null)}
            onSave={async (data) => {
              try {
                if (motifModal === "new") {
                  await createMotivation(data);
                } else {
                  await updateMotivation((motifModal as Motivation).id, data);
                }
                setMotifModal(null);
                reload();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Ошибка сохранения");
              }
            }}
          />
        )}
      </Modal>

      {/* Модалка FAQ */}
      {faqModal !== null && (
        <FaqFormModal
          item={faqModal === "new" ? null : faqModal}
          onClose={() => setFaqModal(null)}
          onSave={async (f) => {
            try {
              if (faqModal === "new") {
                await createFaq(f);
              } else {
                await updateFaq((faqModal as ContentFaq).id, f);
              }
              setFaqModal(null);
              reload();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Ошибка сохранения");
            }
          }}
        />
      )}

      {/* Подтверждение удаления */}
      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Удалить запись?">
        <p className="text-sm text-ink-soft">Запись будет удалена из контента безвозвратно.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Отмена</Button>
          <button
            type="button"
            onClick={async () => {
              try {
                if (deleteTarget?.kind === "m") await deleteMotivation(deleteTarget.id);
                else if (deleteTarget?.kind === "f") await deleteFaq(deleteTarget!.id);
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

function MotivationForm({
  item,
  onClose,
  onSave,
}: {
  item: Motivation | null;
  onClose: () => void;
  onSave: (m: Pick<Motivation, "text" | "emoji">) => void;
}) {
  const [emoji, setEmoji] = useState(item?.emoji ?? "🔥");
  const [text, setText] = useState(item?.text ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim() || !emoji.trim()) return;
        setBusy(true);
        onSave({ emoji: emoji.trim(), text: text.trim() });
      }}
    >
      <label className="block text-xs font-black uppercase tracking-wide text-ink-faint">Эмодзи</label>
      <input
        value={emoji}
        onChange={(e) => setEmoji(e.target.value)}
        maxLength={4}
        className="mt-2 w-28 rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-center text-xl outline-none focus:border-primary"
        required
      />
      <label className="mt-4 block text-xs font-black uppercase tracking-wide text-ink-faint">Текст</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Например: Каждый день — шаг к цели!"
        className="mt-2 w-full resize-none rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        required
      />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={onClose}>Отмена</Button>
        <Button type="submit" disabled={busy || !text.trim()}>Сохранить</Button>
      </div>
    </form>
  );
}