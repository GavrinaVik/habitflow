import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/auth/AuthShell";
import FormField from "../components/auth/FormField";
import PasswordInput from "../components/auth/PasswordInput";
import SocialButtons from "../components/auth/SocialButtons";
import Button from "../components/ui/Button";
import { useAuth } from "../lib/auth";
import { usePageMeta } from "../lib/seo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Страница входа (JWT): email + пароль, «запомнить меня» (сессия 30 дней).
 * После успешного входа — переход на ?next= или в ЛК.
 * Неудачные попытки ограничены на сервере (5 за 15 минут).
 */
export default function LoginPage() {
  usePageMeta("Вход", "Войдите в HabitFlow, чтобы продолжить путь к своим привычкам.");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState("");
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validateEmail = (v: string) =>
    EMAIL_RE.test(v.trim()) ? undefined : "Некорректный email";
  const validatePassword = (v: string) =>
    v.length >= 8 ? undefined : "Минимум 8 символов";

  const touch = (field: "email" | "password") => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({
      ...e,
      email: validateEmail(email),
      password: validatePassword(password),
    }));
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setErrors({ email: emailErr, password: passwordErr });
    if (emailErr || passwordErr) return;

    setServerError("");
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password, remember);
      navigate(next, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка входа";
      setServerError(message);
      const ra = (err as { retryAfter?: number }).retryAfter;
      if (ra) setRetryAfter(ra);
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (invalid?: string) =>
    `w-full rounded-btn border bg-canvas px-4 py-2.5 text-sm outline-none transition-colors ${
      invalid ? "border-red-400 focus:border-red-500" : "border-ink/10 focus:border-primary"
    }`;

  return (
    <AuthShell
      title="Рады видеть снова!"
      subtitle="Войдите, чтобы открыть свой трекер привычек"
      socials={<SocialButtons />}
      footer={
        <>
          Нет аккаунта?{" "}
          <Link to="/register" className="font-bold text-primary hover:text-primary-dark">
            Зарегистрироваться
          </Link>
          {" · "}
          <Link to="/forgot-password" className="font-bold text-primary hover:text-primary-dark">
            Забыли пароль?
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Email" htmlFor="email" error={touched.email ? errors.email : undefined}>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => touch("email")}
            placeholder="you@mail.ru"
            autoComplete="email"
            className={inputCls(touched.email ? errors.email : undefined)}
          />
        </FormField>

        <FormField label="Пароль" htmlFor="password" error={touched.password ? errors.password : undefined}>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            onBlur={() => touch("password")}
            placeholder="••••••••"
            aria-invalid={Boolean(touched.password && errors.password)}
          />
        </FormField>

        <label className="flex items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Запомнить меня
        </label>

        {serverError && (
          <p
            className="animate-pop rounded-btn border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600"
            role="alert"
          >
            {retryAfter
              ? `${serverError} Повторите через ${Math.ceil(retryAfter / 60)} мин.`
              : serverError}
          </p>
        )}

        <Button type="submit" className="w-full" loading={submitting} data-metrica="goal:login-submit">
          Войти
        </Button>
      </form>
    </AuthShell>
  );
}