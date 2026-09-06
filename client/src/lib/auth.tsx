import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { postJson, requestJson } from "./api";
import type { AuthUser } from "./types";

// ---------- Период оплаты (localStorage) ----------

export type BillingPeriod = "month" | "year";
const BILLING_KEY = "habitflow.billing";

export function getBillingPeriod(): BillingPeriod {
  return localStorage.getItem(BILLING_KEY) === "year" ? "year" : "month";
}

export function setBillingPeriod(period: BillingPeriod): void {
  localStorage.setItem(BILLING_KEY, period);
}

// ---------- Аутентификация (JWT в httpOnly-cookie) ----------

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  /** Повторно получить текущего пользователя с /api/auth/me */
  refresh: () => Promise<void>;
  login: (email: string, password: string, remember: boolean) => Promise<AuthUser>;
  register: (name: string, email: string, password: string, hp?: string) => Promise<AuthUser>;
  oauth: (provider: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await requestJson<{ user: AuthUser }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // При загрузке приложения определяем сессию по cookie
  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const data = await postJson<{ user: AuthUser }>("/api/auth/login", {
      email,
      password,
      remember,
    });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, hp = "") => {
    const data = await postJson<{ user: AuthUser }>("/api/auth/register", {
      name,
      email,
      password,
      // honeypot-поле: человек всегда оставляет его пустым
      hp,
    });
    setUser(data.user);
    return data.user;
  }, []);

  const oauth = useCallback(async (provider: string) => {
    const data = await postJson<{ user: AuthUser }>(`/api/auth/oauth/${provider}`);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await postJson("/api/auth/logout");
    } catch {
      // cookie стираем и локально
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, login, register, oauth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth должен использоваться внутри <AuthProvider>");
  return ctx;
}