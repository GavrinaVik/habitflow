import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { calendarCallback } from "../lib/integrations";

/**
 * Мок-страница согласия Google OAuth 2.0.
 * В проде пользователь попадал бы на accounts.google.com/o/oauth2/v2/auth
 * и после разрешения Google редиректил бы на наш callback. В демо
 * роль consent-экрана играет эта страница: «Разрешить» завершает OAuth
 * через POST /api/calendar/callback (обмен code на токены).
 */
export default function GoogleCalendarMockPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<"consent" | "loading" | "done">("consent");
  const [error, setError] = useState("");

  const approve = async (allow: boolean) => {
    if (!allow) return navigate("/dashboard/settings");
    setState("loading");
    try {
      await calendarCallback();
      setState("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось завершить подключение");
      setState("consent");
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f1f3f4] px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-[0_1px_3px_rgba(60,64,67,0.3)]">
          <div className="flex items-center gap-2">
            <span className="text-3xl" aria-hidden="true">🌸</span>
            <span className="font-sans text-xl font-bold tracking-tight text-[#5f6368]">Google</span>
          </div>

          {state === "done" ? (
            <div className="mt-6 text-center">
              <p className="text-4xl" aria-hidden="true">✅</p>
              <h1 className="mt-2 font-display text-xl font-black text-ink">Google Calendar подключён</h1>
              <p className="mt-2 text-sm text-ink-soft">
                События привычек будут синхронизироваться автоматически.
              </p>
              <Link
                to="/dashboard/settings"
                className="mt-6 inline-block rounded-full bg-[#1a73e8] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1765cc]"
              >
                Вернуться в настройки
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mt-4 text-2xl font-semibold text-ink">Войдите через Google</h1>
              <p className="mt-1 text-sm text-ink-soft">Выполните вход, чтобы продолжить работу с HabitFlow</p>

              <div className="mt-6 rounded-lg border border-ink/10 p-4">
                <p className="text-sm font-semibold text-ink">HabitFlow</p>
                <p className="text-xs text-ink-faint">habits@habitflow.app</p>
                <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
                  <li>🌐 Просмотр событий календаря</li>
                  <li>➕ Создание и изменение событий привычек</li>
                </ul>
              </div>

              {error && (
                <p className="mt-3 rounded-card bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">{error}</p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => approve(false)}
                  disabled={state === "loading"}
                  className="flex-1 rounded-full border border-ink/10 px-4 py-2.5 text-sm font-bold text-ink-soft transition-colors hover:bg-canvas"
                >
                  Отклонить
                </button>
                <button
                  type="button"
                  onClick={() => approve(true)}
                  disabled={state === "loading"}
                  className="flex-[2] rounded-full bg-[#1a73e8] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#1765cc]"
                >
                  {state === "loading" ? "Подключаем…" : "Разрешить"}
                </button>
              </div>
              <p className="mt-4 text-center text-[11px] text-ink-faint">
                Демо: реального обращения к серверам Google не происходит.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}