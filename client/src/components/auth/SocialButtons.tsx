import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import Spinner from "../ui/Spinner";

interface SocialButtonsProps {
  /** Вызывается после успешной авторизации (по умолчанию — переход в ЛК) */
  onSuccess?: () => void;
}

/** Иконка VK (стилизованная, задаём фирменный цвет) */
function VkIcon(props: { className?: string }) {
  return (
    <svg viewBox="-3 -2 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.162 18.994c.609 0 .858-.406.851-.915-.031-1.917.714-2.949 2.059-4.444.878-.953 1.904-2.253 2.444-3.393.046-.106.078-.306.069-.518 0-.488-.303-.72-.86-.788-.338-.042-.849-.063-1.229-.063-.36 0-.63.05-.861.213-.301.218-.404.618-.513.997-.082.288-.27.813-.472 1.02-.627.682-.946.786-1.211.51-.285-.292-.309-.797-.363-1.394-.031-.603-.254-1.403-.545-1.747-.22-.26-.741-.387-1.266-.438-.427-.041-1.304-.09-1.822-.088-.566.004-.673.127-.805.395-.243.479-.263 1.253-.047 2.042.343 1.253.845 3.039 1.147 3.65-.177.28-.433.782-.728 1.187-.332.44-.42.634-.212.974.269.442.945.797 1.495.906.573.114 1.16.004 1.573.301.092.065.272.205.332.315.172.185.293.473.42.736.221.454.417.814 1.072.814zM12.06 0C6.709 0 2.357 4.39 2.357 9.794c0 5.362 4.352 9.732 9.703 9.732 5.351 0 9.68-4.37 9.68-9.732C22.06 4.39 17.71 0 12.06 0z" />
    </svg>
  );
}

/** Иконка Telegram */
function TgIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

/** Иконка Google (официальные цвета) */
function GoogleIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const PROVIDERS = [
  { id: "vk", label: "ВКонтакте", Icon: VkIcon, color: "#0077FF" },
  { id: "telegram", label: "Telegram", Icon: TgIcon, color: "#229ED9" },
  { id: "google", label: "Google", Icon: GoogleIcon, color: "#4285F4" },
] as const;

/**
 * Вертикальный блок кнопок входа через соцсети.
 * OAuth пока реализован как мок на сервере, реальные интеграции — после БД.
 */
export default function SocialButtons({ onSuccess }: SocialButtonsProps) {
  const { oauth } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handle = async (provider: string) => {
    if (pending) return;
    setError("");
    setPending(provider);
    try {
      await oauth(provider);
      onSuccess ? onSuccess() : navigate("/dashboard");
    } catch {
      setError("Не удалось войти через соцсеть. Попробуйте ещё раз.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {PROVIDERS.map(({ id, label, Icon, color }) => (
        <button
          key={id}
          type="button"
          onClick={() => handle(id)}
          disabled={pending !== null}
          className="flex w-full items-center justify-center gap-3 rounded-btn border border-ink/10 bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-lift"
          aria-label={`Войти через ${label}`}
        >
          {pending === id ? (
            <Spinner />
          ) : (
            <span className="grid h-5 w-5 place-items-center" style={{ color }}>
              <Icon className="h-4.5 w-4.5" />
            </span>
          )}
          {label}
        </button>
      ))}
      {error && (
        <p className="text-center text-sm font-medium text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}