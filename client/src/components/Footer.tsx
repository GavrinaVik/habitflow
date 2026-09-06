import { Link } from "react-router-dom";

const socials = [
  { label: "VK", href: "https://vk.com", dataMetrica: "goal:social-vk" },
  { label: "Telegram", href: "https://t.me", dataMetrica: "goal:social-telegram" },
  { label: "Instagram", href: "https://instagram.com", dataMetrica: "goal:social-instagram" },
];

const links = [
  { label: "О нас", to: "/#how" },
  { label: "Тарифы", to: "/pricing" },
  { label: "FAQ", to: "/#faq" },
  { label: "Политика конфиденциальности", to: "/" },
  { label: "Оферта", to: "/" },
];

/**
 * Футер: логотип, краткое описание, ссылки и соцсети.
 * Ссылки снабжены data-атрибутами для целей Я.Метрики.
 */
export default function Footer() {
  return (
    <footer className="border-t border-ink/5 bg-canvas" aria-label="Подвал сайта">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Логотип и описание */}
          <div>
            <Link to="/" className="flex items-center gap-2" data-metrica="goal:logo-click">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-lg text-white shadow-soft">
                📈
              </span>
              <span className="font-display text-xl font-extrabold tracking-tight text-ink">
                Habit<span className="text-primary">Flow</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              Превращаем полезные привычки в игру с наградами, сериями и конфетти.
            </p>

            {/* Соцсети */}
            <div className="mt-6 flex gap-2.5">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-metrica={social.dataMetrica}
                  className="grid h-10 w-10 place-items-center rounded-btn border border-ink/10 bg-white font-display text-xs font-black text-ink-soft shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
                  aria-label={social.label}
                >
                  {social.label}
                </a>
              ))}
            </div>
          </div>

          {/* Ссылки */}
          <nav aria-label="Разделы сайта">
            <p className="text-sm font-bold text-ink">Разделы</p>
            <ul className="mt-4 space-y-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-ink-soft transition-colors duration-200 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Контакты */}
          <nav aria-label="Контакты">
            <p className="text-sm font-bold text-ink">Контакты</p>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
              <li>
                <a href="mailto:support@habitflow.app" className="transition-colors duration-200 hover:text-primary">
                  support@habitflow.app
                </a>
              </li>
              <li>Ежедневно с 9:00 до 21:00 (МСК)</li>
              <li>МИР · Visa · Mastercard · СБП</li>
            </ul>
          </nav>
        </div>

        {/* Копирайт */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink/5 pt-6 sm:flex-row">
          <p className="text-xs text-ink-faint">© 2025 HabitFlow. Все права защищены.</p>
          <p className="text-xs text-ink-faint">🇷🇺 Сделано в России</p>
        </div>
      </div>
    </footer>
  );
}