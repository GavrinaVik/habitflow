import Button from "../components/ui/Button";
import { usePageMeta } from "../lib/seo";

/** Страница «404» для неизвестных маршрутов */
export default function NotFoundPage() {
  usePageMeta("Страница не найдена");
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-display text-7xl font-black text-primary">404</p>
      <h1 className="mt-4 font-display text-2xl font-black tracking-tight text-ink">
        Такой страницы нет
      </h1>
      <p className="mt-2 text-ink-soft">
        Возможно, ссылка устарела или вы ошиблись адресом.
      </p>
      <Button to="/" className="mt-6" data-metrica="goal:404-home">
        На главную
      </Button>
    </main>
  );
}