import { useEffect, useState } from "react";
import type { Habit, HabitDay, PeriodStats } from "../../lib/types";
import { downloadShareImage, renderShareCard } from "../../lib/shareImage";
import { shareInstagram, shareVk } from "../../lib/integrations";
import { reachGoal } from "../../lib/metrica";
import Modal from "../ui/Modal";
import Button from "../ui/Button";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  habit: Habit;
  series: HabitDay[];
  stats: PeriodStats;
}

/**
 * Поделиться прогрессом: модалка с превью сгенерированной картинки
 * (1080×1920 для Instagram Stories) и кнопками Instagram / VK.
 * Публикация идёт через API соцсетей (мок-интеграция /api/share).
 */
export default function ShareModal({ open, onClose, habit, series, stats }: ShareModalProps) {
  const [dataUrl, setDataUrl] = useState("");
  const [busy, setBusy] = useState<"" | "instagram" | "vk">("");
  const [result, setResult] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setDataUrl("");
    setResult("");
    const timer = window.setTimeout(() => {
      const url = renderShareCard(habit, series, stats);
      if (active) setDataUrl(url);
    }, 120);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [open, habit, series, stats]);

  const handleInstagram = async () => {
    if (!dataUrl || busy) return;
    setBusy("instagram");
    setResult("");
    try {
      const post = await shareInstagram(`Моя привычка «${habit.name}» — прогресс 🔥`, dataUrl);
      reachGoal("share-instagram");
      setResult(`Публикация отправлена в очередь (${post.post_id}).`);
      downloadShareImage(dataUrl);
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Не удалось опубликовать в Instagram");
    } finally {
      setBusy("");
    }
  };

  const handleVk = async () => {
    if (!dataUrl || busy) return;
    setBusy("vk");
    setResult("");
    try {
      const post = await shareVk(
        `Моя привычка «${habit.name}»: ${stats.done} из ${stats.total} дней · серия ${stats.streak} 🔥 #habitflow`,
        dataUrl
      );
      reachGoal("share-vk");
      setResult(`Опубликовано: ${post.post_url ?? ""}`);
      window.open(
        `https://vk.com/share.php?url=${encodeURIComponent(window.location.href)}&title=${encodeURIComponent(
          `Моя привычка «${habit.name}»: ${stats.done} из ${stats.total} дней`
        )}&comment=${encodeURIComponent("#habitflow #прогресс")}`,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Не удалось опубликовать в VK");
    } finally {
      setBusy("");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Поделиться прогрессом">
      <div className="mx-auto w-full max-w-[250px]">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="Превью картинки с прогрессом привычки"
            className="w-full rounded-card shadow-lift"
          />
        ) : (
          <div className="grid aspect-[9/16] w-full place-items-center rounded-card bg-canvas text-sm font-bold text-ink-faint">
            Генерируем картинку…
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs font-semibold text-ink-soft">
        Stories 1080×1920: название привычки, график и главные цифры.
      </p>

      {result && (
        <p className="mt-3 rounded-card bg-primary-soft px-3 py-2 text-center text-xs font-medium text-primary-deep">
          {result}
        </p>
      )}

      <div className="mt-5 grid gap-2">
        <Button
          onClick={handleInstagram}
          loading={busy === "instagram"}
          disabled={!dataUrl}
          className="w-full"
          data-metrica="goal:share-instagram"
        >
          📸 Instagram — опубликовать в Stories
        </Button>
        <Button
          variant="secondary"
          onClick={handleVk}
          loading={busy === "vk"}
          disabled={!dataUrl}
          className="w-full"
          data-metrica="goal:share-vk"
        >
          ВК Поделиться в VK
        </Button>
      </div>
      <p className="mt-3 text-center text-[11px] font-semibold text-ink-faint">
        Instagram: картинка также сохраняется локально — можно загрузить вручную.
      </p>
    </Modal>
  );
}