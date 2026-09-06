import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import FormField from "../components/auth/FormField";
import PasswordInput from "../components/auth/PasswordInput";
import Button from "../components/ui/Button";
import { postJson } from "../lib/api";
import { usePageMeta } from "../lib/seo";

/**
 * Страница установки нового пароля по токену из письма.
 * Токен одноразовый и живёт 1 час.
 */
export default function ResetPasswordPage() {
  usePageMeta("Новый пароль", "Установите новый пароль для аккаунта HabitFlow.");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const next: { password?: string; confirm?: string } = {};
    if (password.length < 8) next.password = "Минимум 8 символов";
    if (confirm !== password) next.confirm = "Пароли не совпадают";
    setErrors(next);
    if (next.password || next.confirm) return;

    setSubmitting(true);
    setServerError("");
    try {
      await postJson("/api/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Не удалось сбросить пароль. Попробуйте ещё раз."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <AuthShell
        title="Пароль обновлён 🎉"
        subtitle="Теперь войдите с новым паролем"
        footer={
          <Link to="/login" className="font-bold text-primary hover:text-primary-dark">
            Перейти ко входу →
          </Link>
        }
      >
        <Button onClick={() => navigate("/login")} className="mt-2 w-full">
          Войти
        </Button>
      </AuthShell>
    );
  }

  if (!token) {
    return (
      <AuthShell
        title="Ссылка недействительна"
        subtitle="Попробуйте запросить сброс пароля ещё раз"
        footer={
          <Link to="/forgot-password" className="font-bold text-primary hover:text-primary-dark">
            Запросить новую ссылку
          </Link>
        }
      />
    );
  }

  return (
    <AuthShell
      title="Новый пароль"
      subtitle="Придумайте надёжный пароль — минимум 8 символов"
      footer={
        <Link to="/login" className="font-bold text-primary hover:text-primary-dark">
          ← Вернуться ко входу
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField
          label="Новый пароль"
          htmlFor="password"
          error={errors.password}
          hint="Буквы, цифры и символы — пароль будет надёжнее"
        >
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            showStrength
            aria-invalid={Boolean(errors.password)}
          />
        </FormField>

        <FormField label="Повторите пароль" htmlFor="confirm" error={errors.confirm}>
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={setConfirm}
            placeholder="••••••••"
            aria-invalid={Boolean(errors.confirm)}
          />
        </FormField>

        {serverError && (
          <p
            className="animate-pop rounded-btn border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600"
            role="alert"
          >
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" loading={submitting} data-metrica="goal:reset-submit">
          Сохранить пароль
        </Button>
      </form>
    </AuthShell>
  );
}