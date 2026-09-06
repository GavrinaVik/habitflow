import { useEffect } from "react";

const SITE_NAME = "HabitFlow";

/**
 * SEO для SPA: ставит document.title и meta[name=description] на роут.
 * (Для полноценного JS-рендеринга — pre-render/SSR, но заголовки важны
 * и для соцсетей, и для вкладок.)
 */
export function usePageMeta(title: string, description?: string): void {
  useEffect(() => {
    document.title = title === SITE_NAME ? title : `${title} — ${SITE_NAME}`;
    if (description) {
      const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      meta?.setAttribute("content", description);
    }
  }, [title, description]);
}