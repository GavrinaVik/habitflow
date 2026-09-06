import type { ReactNode } from "react";
import Card from "../ui/Card";
import Reveal from "../ui/Reveal";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  /** Содержимое карточки (форма или сообщение о результате) */
  children?: ReactNode;
  /** Кнопки соцсетей (рендерятся сверху с разделителем «или») */
  socials?: ReactNode;
  /** Нижняя строка со ссылками */
  footer?: ReactNode;
}

/**
 * Общая обёртка страниц входа/регистрации/восстановления:
 * центрированная карточка, заголовок, соцсети с разделителем и футер-ссылки.
 */
export default function AuthShell({ title, subtitle, children, socials, footer }: AuthShellProps) {
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-14 sm:px-6">
      <Reveal className="w-full max-w-md">
        <Card className="p-8">
          <h1 className="text-center font-display text-2xl font-black tracking-tight text-ink">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-center text-sm text-ink-soft">{subtitle}</p>}

          {socials && (
            <>
              <div className="mt-6">{socials}</div>
              <div className="my-6 flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-ink/10" />
                <span className="text-xs font-bold text-ink-faint">или</span>
                <span className="h-px flex-1 bg-ink/10" />
              </div>
            </>
          )}

          <div className="mt-2">{children}</div>
        </Card>

        {footer && <div className="mt-5 text-center text-sm">{footer}</div>}
      </Reveal>
    </main>
  );
}