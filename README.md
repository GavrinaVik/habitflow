# HabitFlow 📈

SaaS-приложение для трекинга привычек с геймификацией: численные цели, прогресс-бары, серии и конфетти при достижении 100%.

Демо: фронтенд и API запускаются локально (см. «Установка и запуск»). Вся бизнес-логика покрыта интеграциями-моками (платежи ЮKassa, письма Unisender, Google Calendar, публикации в соцсети), которые легко заменить на реальные сервисы через переменные окружения.

friendly-crisp-4b0214.netlify.app
<img width="1837" height="1281" alt="изображение" src="https://github.com/user-attachments/assets/d5791076-af16-40c8-8265-29cd0c96c69a" />


<img width="1567" height="1057" alt="изображение" src="https://github.com/user-attachments/assets/9df94e08-a6ab-4906-8eef-b4c9f3d26ff5" />


---

## 1. Описание проекта

HabitFlow помогает превращать полезные привычки в измеримый прогресс:

- **Регистрация и вход** — email + пароль (bcrypt, JWT в httpOnly-cookie) или соцсети (VK, Telegram, Google, Яндекс, Apple — мок OAuth).
- **Личный кабинет** — создание привычек (численная цель, единицы, частота, напоминание), чек-ин «Сделал / Не сделал», прогресс-бар, серии, конфетти.
- **Детальная статистика** — график за неделю/месяц/всё время, статистика, история с пагинацией, экспорт в CSV (Pro+), публикация картинки прогресса в соцсети.
- **Тарифы** — Free / Pro / Premium с лимитами (Free: до 3 привычек, неделя на графике), оплата через ЮKassa (тестовый режим).
- **Интеграции** — ЮKassa, Unisender (письма и рассылки), Google Calendar (Premium), соцсети, Яндекс.Метрика.
- **Админ-панель** — пользователи, платежи, контент (мотивации, FAQ, бонусы), настройки тарифов и шаблонов писем, журнал действий.

### Демо-доступы

| Роль    | Email                    | Пароль        |
|---------|--------------------------|---------------|
| Пользователь | `alex@habitflow.app` | `habitflow123` |
| Админ    | `admin@habitflow.app`    | `admin123`    |

Админ-панель: `http://localhost:5173/admin` (ссылка появляется в меню аватара у админов).

---

## 2. Технологический стек

- **Frontend**: React 19 + TypeScript + Vite 6 + Tailwind CSS 4 (дизайн в стиле Duolingo: Nunito для заголовков, Inter для текста)
- **Backend**: Node.js + Express 4 (TypeScript, ESM), данные в памяти — без внешней БД на текущем этапе
- **Auth**: JWT (`jsonwebtoken`) в httpOnly-cookie + `bcryptjs`
- **Сборка**: npm workspaces (`client` / `server`), `tsc`

---

## 3. Установка и запуск (локально)

Требуется Node.js ≥ 20 и npm ≥ 9.

```bash
# 1. Клонировать и установить зависимости (все воркспейсы сразу)
git clone <репозиторий> habitflow
cd habitflow
npm install

# 2. Запустить dev-режим (одновременно API и клиент)
npm run dev
```

- Клиент (Vite): http://localhost:5173
- API (Express): http://localhost:3001 (health-check `/api/health`)
- Vite проксирует `/api` на :3001 — CORS в dev не мешает.

Сборка и прод-запуск:

```bash
npm run build    # tsc + vite build (и клиент, и сервер)
npm start        # запуск собранного сервера (отдаёт API; клиент — отдельно)
```

> Данные хранятся в памяти и сбрасываются при перезапуске сервера. Клиент при недоступности API автоматически использует встроенные фолбэк-данные (`client/src/data/fallback.ts`).

---

## 4. Переменные окружения

Скопируйте `.env.example` в `.env`. Все значения необязательны: сервер работает на моках с дефолтами. Ниже — минимальный набор для прода:

| Переменная | Описание | Дефолт / пример |
|------------|----------|-----------------|
| `NODE_ENV` | `development` / `production` | `development` |
| `PORT` | Порт API | `3001` |
| `ALLOWED_ORIGINS` | Разрешённые Origin для CORS (через запятую) | `http://localhost:5173,http://127.0.0.1:5173` |
| `JWT_SECRET` | Секрет подписи токенов. **Обязателен в проде!** | `habitflow-dev-secret-change-me` |
| `YUKASSA_SHOP_ID` | ID магазина ЮKassa | `123456` |
| `YUKASSA_SECRET_KEY` | Секрет ЮKassa | `test_...` |
| `UNISENDER_API_KEY` | Ключ Unisender API | `1234567890` |
| `GOOGLE_CALENDAR_CLIENT_ID` | OAuth Client ID Google Calendar | `...apps.googleusercontent.com` |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Секрет OAuth | `GOCSPX-...` |
| `YANDEX_METRIKA_ID` | ID счётчика Метрики | `98765432` |
| `DATABASE_URL` | PostgreSQL (следующий этап: Supabase/Railway) | `postgres://...` |

Полный `.env`-шаблон с комментариями — в [`.env.example`](.env.example).

---

## 5. Структура проекта

```
treker/
├── client/                    # React-приложение (Vite)
│   ├── public/                # robots.txt, sitemap.xml (статик, копируется в dist)
│   └── src/
│       ├── components/        # Navbar, Hero, HowItWorks, Features, Pricing, Faq, Footer,
│       │   ├── auth/          #   AuthShell, FormField, PasswordInput, SocialButtons
│       │   ├── dashboard/     #   DashboardHeader, HabitCard, WeekCalendar, CheckInModal,
│       │   │   ├── chart/     #   ShareModal, HabitChart, StatsGrid, PeriodTabs ...
│       │   ├── admin/         #   AdminLayout, charts
│       │   └── ui/            #   Button, Modal, Badge, Card, Accordion, Spinner
│       ├── data/fallback.ts   # фолбэк-данные (если API недоступен)
│       ├── hooks/useHabits.ts # CRUD привычек + метрики
│       ├── lib/               # api.ts, auth.tsx, types.ts, integrations.ts, metrica.ts, seo.ts
│       └── pages/             # Landing, Pricing, Register, Login, Checkout, MockPayment,
│           │                  # Dashboard, HabitDetail, Settings, admin/*, GoogleCalendarMock
│           └── admin/         # страницы админки
├── server/                    # Express API (TypeScript, ESM)
│   └── src/
│       ├── index.ts           # приложение: CORS-whitelist, security-заголовки, rate limit
│       ├── routes.ts          # привычки, статистика, CSВ
│       ├── auth.ts            # JWT, bcrypt, OAuth-мок, сброс пароля
│       ├── data.ts            # in-memory хранилище и сиды
│       ├── admin.ts           # админ-API + демо-дата (1234 пользователя)
│       ├── payments.ts        # ЮKassa (мок): create, webhook, активация тарифа
│       ├── email.ts           # Unisender (мок): шаблоны, лог, рассылки
│       ├── calendar.ts        # Google Calendar (мок, Premium)
│       └── share.ts           # публикации Instagram / VK (мок)
├── vercel.json                # конфиг фронтенда на Vercel (SPA + заголовки)
├── railway.json               # конфиг бэкенда на Railway
└── package.json               # npm workspaces
```

---

## 6. API-документация

Авторизация: JWT в httpOnly-cookie `habitflow_token` (недоступен скриптам — защита от XSS, `SameSite=Lax`, в проде `Secure`). JSON-ответы; на верхнем уровне ошибка — `{ "error": "..." }`.

### Базовые и привычки

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Статус сервиса |
| GET | `/api/pricing` | Список тарифов |
| GET | `/api/pricing/faq` | FAQ по тарифам |
| GET | `/api/faq` | Частые вопросы |
| GET | `/api/habits` | Список привычек с историей |
| POST | `/api/habits` | Создать привычку (body: `name`, `target` (число>0), `unit`, `frequency`, `reminderTime`) |
| GET | `/api/habits/:id` | Детальная карточка привычки |
| PUT | `/api/habits/:id` | Обновить привычку |
| DELETE | `/api/habits/:id` | Удалить привычку |
| POST | `/api/habits/:id/log` | Чек-ин (body: `value`; 0 — «не сделал») |
| GET | `/api/habits/:id/stats` | Статистика (completionRate, streak, …) |
| GET | `/api/habits/:id/history?page=&limit=` | История (пагинация, max 50) |
| GET | `/api/habits/:id/export` | Экспорт истории в CSV (Pro+) |

### Аутентификация

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация (bcrypt, honeypot, письмо + onboarding) |
| POST | `/api/auth/login` | Вход (rate limit 5/15 мин) |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/auth/me` | Текущий пользователь |
| POST | `/api/auth/oauth/:provider` | Соцвход (мок: vk, telegram, google, yandex, apple) |
| POST | `/api/auth/forgot-password` | Сброс пароля (письмо; в dev возвращает resetUrl) |
| POST | `/api/auth/reset-password` | Смена пароля по токену (1 час) |
| POST | `/api/auth/confirm` | Подтверждение email по токену |
| POST | `/api/auth/resend-confirm` | Переслать письмо подтверждения |
| POST | `/api/auth/subscribe` | Включить/выключить рассылку (body: `subscribed`) |

### Интеграции (мок-сервисы)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/payments/create` | Создать платёж ЮKassa (body: `plan`, `period`) → `payment_url` |
| GET | `/api/payments/:id` | Статус платежа (владелец) |
| POST | `/api/payments/webhook` | Webhook: `payment.succeeded`/`payment.canceled` → смена тарифа, чек, журнал |
| POST | `/api/email/send` | Отправить письмо по шаблону |
| POST | `/api/email/subscribe` / `/unsubscribe` | Рассылка (Unisender) |
| GET | `/api/email/log?limit=` | Лог писем (только админ) |
| POST | `/api/calendar/connect` | OAuth Google Calendar (Premium) → `auth_url` |
| POST | `/api/calendar/callback` | Завершить OAuth + авто-синк привычек |
| GET | `/api/calendar/status` | Статус подключения |
| POST | `/api/calendar/disconnect` | Отключить календарь |
| POST | `/api/calendar/sync` | Синк привычек (`habit_id` или `"all"`) |
| POST | `/api/share/instagram` | Публикация в Instagram (очередь, мок) |
| POST | `/api/share/vk` | Публикация в VK (мок) |
| GET | `/api/share/my` | Мои публикации |

### Админ-панель (роль `admin`, под JWT)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/admin/stats` | Сводка: пользователи, MRR, конверсия, графики, действия |
| GET | `/api/admin/users?search=&plan=&active=&page=&limit=` | Пользователи (пагинация) |
| GET | `/api/admin/users/:id` | Профиль + журнал действий |
| PUT | `/api/admin/users/:id/plan` | Смена тарифа (body: `plan`) + письмо |
| POST | `/api/admin/users/:id/block` / `/unblock` | Блокировка / разблокировка |
| DELETE | `/api/admin/users/:id` | Удалить аккаунт (rate limit 5/мин) |
| GET | `/api/admin/payments?status=&from=&to=&page=&limit=` | Платежи; `export=1` → CSV |
| GET/POST/PUT/DELETE | `/api/admin/content/motivations[/:id]` | Мотивационные фразы |
| GET/POST/PUT/DELETE | `/api/admin/content/faq[/:id]` | FAQ (drag & drop; `PUT …/order`) |
| GET/POST/PUT/DELETE | `/api/admin/content/bonuses[/:id]` | Бонусы партнёров |
| GET/PUT | `/api/admin/settings` | Цены, реклама, оферта, шаблоны писем |
| GET | `/api/admin/audit?limit=` | Журнал действий админа |

---

## 7. Деплой

### Вариант 1 — Vercel (фронтенд) + Railway (бэкенд) + Supabase (БД) — рекомендуется

1. **Frontend → Vercel**:
   - Импортируйте GitHub-репозиторий в Vercel (framework: Vite; `vercel.json` уже в корне — SPA-rewrites, заголовки кэширования, robots/sitemap).
   - Домен: добавьте свой или используйте поддомен `.vercel.app`.
2. **Backend → Railway**:
   - Новый проект Railway из того же репозитория (`railway.json` уже настроен: nixpacks, `npm run start`, healthcheck `/api/health`).
   - Задайте переменные: `JWT_SECRET`, `ALLOWED_ORIGINS=https://<ваш-frontend>.vercel.app`, `NODE_ENV=production`, ключи ЮKassa/Unisender/Google/Metrika.
   - Домен API: Railway выдаёт URL (например `habitflow-production.up.railway.app`) — укажите его в `ALLOWED_ORIGINS` не нужно, но фронтенд должен ходить на него. Для этого замените Vite-прокси на переменную `VITE_API_BASE` (или проксируйте `/api` через Vercel Rewrite на Railway).
3. **База → Supabase (PostgreSQL)**:
   - Создайте проект, заполните `DATABASE_URL`. *(Текущий сервер хранит данные в памяти; подключение БД — следующий этап.)*
4. **Метрика/письма**: укажите `YANDEX_METRIKA_ID`, `UNISENDER_API_KEY`; в `client/index.html` замените локальный мок-сниппет на реальный `mc.yandex.ru`.

### Вариант 2 — всё на Railway

- Один сервис Railway, команда `npm install && npm run build && npm start` (фронтенд собрать в `client/dist` и отдавать статику через Express через `express.static` — добавьте middleware) либо два сервиса (frontend на Vercel, backend на Railway) как в Варианте 1.
- MySQL/PostgreSQL через Railway Database, `DATABASE_URL` в переменных.

### GitHub-репозиторий

```bash
git init && git add . && git commit -m "HabitFlow: MVP + интеграции (ЮKassa, Unisender, GCal, соцсети, Метрика)"
git remote add origin git@github.com:<вы>/habitflow.git
git push -u origin main
```

`.gitignore` уже исключает `node_modules/`, `dist/`, `.env`, логи.

---

## 8. Лицензия

MIT — см. [LICENSE](LICENSE).
