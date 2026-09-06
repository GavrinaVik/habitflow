import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { NextFunction, Request, Response } from "express";
import routes from "./routes.js";
import authRouter from "./auth.js";
import adminRouter from "./admin.js";
import paymentsRouter from "./payments.js";
import emailRouter from "./email.js";
import calendarRouter from "./calendar.js";
import shareRouter from "./share.js";

const PORT = Number(process.env.PORT ?? 3001);
const PROD = process.env.NODE_ENV === "production";

const app = express();

// CORS: разрешаем только фронтенд (а не всё подряд)
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);
app.use(
  cors({
    origin(origin, callback) {
      // curl/без Origin => можно; браузеру с неизвестным Origin — нет
      if (!origin || ALLOWED_ORIGINS.has(origin)) return callback(null, true);
      callback(new Error("Origin не разрешён"));
    },
    credentials: true,
  })
);

// Базовые security-заголовки (JSON-only API, строгий CSP)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  );
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser()); // парсим httpOnly-cookie с JWT

// Общий rate limit для «дорогих» auth-эндпоинтов (регистрация, сброс, подтверждение)
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX = 20;
const authHits = new Map<string, { count: number; first: number }>();
app.use("/api/auth", (req: Request, res: Response, next: NextFunction) => {
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    const key = `${req.ip ?? "?"}|${req.path}`;
    const now = Date.now();
    const rec = authHits.get(key);
    if (rec && now - rec.first < AUTH_WINDOW_MS) {
      rec.count += 1;
      if (rec.count > AUTH_MAX) {
        const retry = Math.ceil((rec.first + AUTH_WINDOW_MS - now) / 1000);
        return void res.status(429).json({ error: `Слишком много запросов. Повторите через ${retry} сек.` });
      }
    } else {
      authHits.set(key, { count: 1, first: now });
    }
  }
  next();
});

app.get("/", (_req, res) => {
  res.json({ name: "HabitFlow API", docs: "/api/health" });
});

app.use("/api", routes);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/email", emailRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/share", shareRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Endpoint не найден" });
});

// Ошибки (в т.ч. отклонённый CORS-Origin)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message === "Origin не разрешён") {
    return void res.status(403).json({ error: "Доступ с этого Origin запрещён" });
  }
  if (err instanceof SyntaxError && "status" in err) {
    return void res.status(400).json({ error: "Некорректный JSON в теле запроса" });
  }
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

app.listen(PORT, () => {
  console.log(`⚡ HabitFlow API запущен: http://localhost:${PORT} (${PROD ? "production" : "dev"})`);
});