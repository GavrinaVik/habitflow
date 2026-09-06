import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import FormField from "../components/auth/FormField";
import Button from "../components/ui/Button";
import { postJson } from "../lib/api";
import { usePageMeta } from "../lib/seo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Страница «Забыли пароль»: всегда отвечает одинаково,
 * чтобы не раскрывать, существует ли указанный email.
 * В dev-режиме сервер возвращает resetUrl для тестирования.
 */
export default function ForgotPasswordPage() {
  usePageMeta("Восстановление пароля", "Восстановите доступ к аккаунту HabitFlow по email.");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [devUrl, setDevUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const nextError = EMAIL_RE.test(email.trim()) ? "" : "Некорректный email";
    setError(nextError);
    if (nextError) return;

    setSubmitting(true);
    try {
      const data = (await postJson("/api/auth/forgot-password", { email })) as {
        resetUrl?: string;
      };
      setDone(true);
      if (data.resetUrl) setDevUrl(data.resetUrl); // mock-режим без почты
    } catch {
      setError("Не удалось отправить письмо. Попробуйте позже.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell
        title="Проверьте почту"
        subtitle={`Мы отправили ссылку для сброса пароля на ${email.trim()}`}
        footer={
          <Link to="/login" className="font-bold text-primary hover:text-primary-dark">
            ← Вернуться ко входу
          </Link>
        }
      >
        <div className="mt-2 text-center">
          <p className="text-sm text-ink-soft">
            Письмо придёт в течение пары минут. Если его нет — проверьте папку «Спам».
          </p>
          {devUrl && (
            <a
              href={devUrl}
              className="mt-4 inline-block rounded-btn bg-primary-soft px-4 py-2 text-sm font-bold text-primary-deep"
            >
              Открыть ссылку (dev-режим)
            </a>
          )}
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Восстановление пароля"
      subtitle="Укажите email — пришлём ссылку для сброса"
      footer={
        <Link to="/login" className="font-bold text-primary hover:text-primary-dark">
          ← Вернуться ко входу
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Email" htmlFor="email" error={touched ? error : undefined}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="you@mail.ru"
            autoComplete="email"
            className={`w-full rounded-btn border bg-canvas px-4 py-2.5 text-sm outline-none transition-colors ${
              touched && error
                ? "border-red-400 focus:border-red-500"
                : "border-ink/10 focus:border-primary"
            }`}
          />
        </FormField>

        <Button type="submit" className="w-full" loading={submitting} data-metrica="goal:forgot-submit">
          Отправить письмо
        </Button>
      </form>
    </AuthShell>
  );
}