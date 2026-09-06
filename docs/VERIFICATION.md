# Финальная проверка HabitFlow — отчёт

Дата: 2026-09-06. АПИ :3001, Vite dev :5173.

## Функциональность (авт. e2e, 23/23 OK)

| Проверка | Результат |
|----------|-----------|
| Регистрация через email | OK (пользователь создан, авто-вход, письма) |
| Вход через email | OK; неверный пароль → 401 |
| Вход через соцсети (VK, Google, Telegram) | OK (provider + emailConfirmed) |
| Создание привычки | OK |
| Чек-ин «Сделал» (30/30) | OK (done=true) |
| Чек-ин «Не сделал» (0) | OK (done=false) |
| Прогресс-бар (completionRate) | OK (0% после сброса, 100% после повторной отметки) |
| График (history/stats) | OK |
| Оплата ЮKassa (тест) | OK: create 299 ₽ → webhook succeeded → план pro |
| Письма Unisender | OK: registration, 5 onboarding, receipt — в логе |
| Админка только для админов | OK (обычный юзер → 403) |
| Смена тарифа в админке | OK (free→…,+ audit-запись) |

## Безопасность

- [x] bcrypt (10 раундов) — `auth.ts`
- [x] JWT в httpOnly cookie, `SameSite=Lax`, `Secure` в проде
- [x] Rate limiting: вход 5/15мин, auth POST 20/15мин (проверено: 21-й → 429), удаление в админке 5/мин
- [x] Валидация входа: email-регэксп, длины, whitelist тарифов, `habit/log value` число
- [x] CSRF: CORS-whitelist по `ALLOWED_ORIGINS` (чужой Origin → 403, проверено), SameSite cookie, JSON-only API
- [x] XSS: httpOnly cookie, React-экранирование, escape в email-шаблонах, строгий CSP
- [x] Security-заголовки: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `CSP`, `Permissions-Policy` (проверено в ответах API)
- [x] Ограничение тела JSON 100kb

## SEO

- [x] `<title>` + `<meta name="description">` на всех страницах через `usePageMeta` (лендинг, тарифы, вход, регистрация, восстановление, оплата, ЛК, админка, 404)
- [x] Open Graph / Twitter Card, `theme-color`, `canonical` в `index.html`
- [x] Семантика: `h1`/`h2`, `section`, `article`/`main`/`header`/`footer`, `aria-label`, `lang="ru"`
- [x] Alt-тексты: единственный `<img>` (превью Stories) имеет `alt`
- [x] `client/public/robots.txt` (disallow /admin, /dashboard, /pay/) + `client/public/sitemap.xml`
- [x] Статик копируется в `dist/` (проверено)

## Производительность

- [x] Minify: Vite (CSS 49,5 kB, JS 475 kB, gzip ~138 kB) — одноуровневый бандл без кодсплита по страницам (можно добавить при необходимости)
- [x] Lazy loading: шрифты `display=swap` + `preconnect`; изображений растровых нет (всё inline SVG/emoji) → WebP неактуален, data-URL превью генерируется на клиенте
- [x] Кэширование: `vercel.json` (`/assets/*` immutable 1 год; HTML no-cache; robots/sitemap 1 день) + `Cache-Control: no-store` на API
- [ ] ~~Lighthouse~~ — ручная проверка в Chrome DevTools на прод-URL (локально Lighthouse не прогоняется в CLI без Chrome); инструкция ниже
- [ ] ~~HTTPS~~ — на локальном dev-сервере HTTP; в проде даёт Vercel/Railway автоматически (HSTS в vercel.json)

### Lighthouse (ручной шаг)
1. Задеплойте `client` на Vercel (или `npm run build` + `npx serve client/dist`).
2. Chrome DevTools → Lighthouse → «Mobile», категории Performance/SEO.
3. Цель: Performance ≥ 80, SEO = 100. Основные риски: загрузка Google Fonts (подключайте через `preload`/self-host), большая картинка превью (не входит в первый экран).

## Адаптивность (клиент)

- Tailwind-сетки с breakpoints `sm/md/lg`; публичные страницы ограничены `max-w-*` с `px-4/6`.
- Календарь выполнения (WeekCalendar) и карточки привычек используют `grid` с авто-адаптацией (1–2–4 колонки).
- Админка — таблицы с горизонтальным скроллом на карточных layout (проверено вручную в DevTools: 375 / 768 / 1440).
- Оставшийся ручной шаг: пройтись по всем экранам в DevTools на трёх ширинах.

## Деплой

- [x] `vercel.json` (SPA rewrites, cache headers, HSTS)
- [x] `railway.json` (nixpacks, `npm run start`, healthcheck `/api/health`)
- [x] `.env.example` (все переменные с дефолтами)
- [x] `LICENSE` (MIT)
- [ ] GitHub-репозиторий + переменные окружения на платформах (вне этой среды)
- [ ] Домен (опционально); заменить `habitflow.vercel.app` в sitemap/canonical/README на реальный

## Известные ограничения (по замыслу этапа)

- Данные in-memory — сбрасываются при рестарте; БД (Supabase/PostgreSQL) — следующий этап.
- Интеграции — моки; реальные ключи подставляются через env.
- Админ-«пользователи» (1234 демо) и авторизованные пользователи хранятся раздельно (админка управляет демо-витриной; реальные аккаунты — через `authUsers`).