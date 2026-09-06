import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import AuthShell from "../components/auth/AuthShell";
import FormField from "../components/auth/FormField";
import PasswordInput from "../components/auth/PasswordInput";
import SocialButtons from "../components/auth/SocialButtons";
import Button from "../components/ui/Button";
import { useAuth } from "../lib/auth";
import { FALLBACK_PLANS } from "../data/fallback";
import { reachGoal } from "../lib/metrica";
import { usePageMeta } from "../lib/seo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Errors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  agree?: string;
}

/**
 * Страница регистрации (JWT): имя, email, пароль с индикатором сложности,
 * подтверждение и согласие с офертой. Валидация по blur — ошибки красным.
 * После успешной регистрации пользователь автоматически авторизован и
 * направляется на оплату выбранного тарифа (или в ЛК).
 */
export default function RegisterPage() {
  usePageMeta("Регистрация", "Создайте аккаунт HabitFlow и начните превращать привычки в прогресс.");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [hp, setHp] = useState(""); // honeypot для ботов
  const [touched, setTouched] = useState<Partial<Record<string, boolean>>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const planId = searchParams.get("plan");
  const period = searchParams.get("period") === "year" ? "year" : "month";
  const plan = FALLBACK_PLANS.find((p) => p.id === planId);
  const next = searchParams.get("next") ?? (planId ? `/checkout?plan=${planId}&period=${period}` : "/dashboard");

  // ---------- Валидация ----------

  const validateField = (field: keyof Errors): string | undefined => {
    switch (field) {
      case "name":
        if (name.trim().length < 2) return "Введите имя";
        return undefined;
      case "email":
        if (!EMAIL_RE.test(email.trim())) return "Некорректный email";
        return undefined;
      case "password":
        if (password.length < 8) return "Минимум 8 символов";
        return undefined;
      case "confirm":
        if (confirm !== password) return "Пароли не совпадают";
        return undefined;
      case "agree":
        return agree ? undefined : "Примите условия, чтобы продолжить";
    }
  };

  const touch = (field: keyof Errors) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validateField(field) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Проверяем все поля разом; фокусируемся не даём — показываем ошибки
    const nextErrors: Errors = {
      name: validateField("name"),
      email: validateField("email"),
      password: validateField("password"),
      confirm: validateField("confirm"),
      agree: validateField("agree"),
    };
    setErrors(nextErrors);
    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) return;

    setServerError("");
    setSubmitting(true);
    try {
      // hp — honeypot: человек оставляет его пустым и в теле он не передаётся
      await register(name.trim(), email.trim().toLowerCase(), password, hp);
      reachGoal("registration");
      navigate(next, { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = (invalid?: string) =>
    `w-full rounded-btn border bg-canvas px-4 py-2.5 text-sm outline-none transition-colors ${
      invalid ? "border-red-400 focus:border-red-500" : "border-ink/10 focus:border-primary"
    }`;

  return (
    <AuthShell
      title="Создать аккаунт"
      subtitle={
        plan
          ? `Оформляете тариф: ${plan.name} · ${period === "year" ? "год" : "месяц"}`
          : "Бесплатно навсегда. Платите только когда захотите больше."
      }
      socials={<SocialButtons />}
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link to={`/login${window.location.search}`} className="font-bold text-primary hover:text-primary-dark">
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* honeypot-поле (скрыто) */}
        <input
          type="text"
          name="hp"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
        />

        <FormField label="Имя" htmlFor="name" error={touched.name ? errors.name : undefined}>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => touch("name")}
            placeholder="Алекс"
            autoComplete="name"
            className={inputBase(touched.name ? errors.name : undefined)}
          />
        </FormField>

        <FormField label="Email" htmlFor="email" error={touched.email ? errors.email : undefined} hint="На него придёт письмо с подтверждением">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => touch("email")}
            placeholder="you@mail.ru"
            autoComplete="email"
            className={inputBase(touched.email ? errors.email : undefined)}
          />
        </FormField>

        <FormField
          label="Пароль"
          htmlFor="password"
          error={touched.password ? errors.password : undefined}
          hint="Минимум 8 символов: буквы, цифры и символы — чем больше, тем лучше"
        >
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            onBlur={() => touch("password")}
            placeholder="••••••••"
            showStrength
            aria-invalid={Boolean(touched.password && errors.password)}
          />
        </FormField>

        <FormField label="Повторите пароль" htmlFor="confirm" error={touched.confirm ? errors.confirm : undefined}>
          <PasswordInput
            id="confirm"
            value={confirm}
            onChange={setConfirm}
            onBlur={() => touch("confirm")}
            placeholder="••••••••"
            aria-invalid={Boolean(touched.confirm && errors.confirm)}
          />
        </FormField>

        {/* Согласие с офертой */}
        <div>
          <label className="flex items-start gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              onBlur={() => touch("agree")}
              className="mt-0.5 h-4 w-4 accent-primary"
            />
            <span>
              Я согласен с{" "}
              <span className="text-primary hover:text-primary-dark">условиями оферты</span> и{" "}
              <span className="text-primary hover:text-primary-dark">политикой конфиденциальности</span>
            </span>
          </label>
          {touched.agree && errors.agree && (
            <p className="mt-1.5 text-sm font-medium text-red-500" role="alert">
              {errors.agree}
            </p>
          )}
        </div>

        {serverError && (
          <p
            className="animate-pop rounded-btn border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600"
            role="alert"
          >
            {serverError}
          </p>
        )}

        <Button type="submit" className="w-full" loading={submitting} data-metrica="goal:register-submit">
          Создать аккаунт
        </Button>

        <p className="text-center text-xs text-ink-faint">
          Регистрируясь, вы подтверждаете, что вам есть 18 лет.
        </p>
      </form>
    </AuthShell>
  );
}