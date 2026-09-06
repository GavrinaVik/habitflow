import Button from "../ui/Button";

const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

interface GreetingProps {
  name: string;
  onAdd: () => void;
}

/** Приветствие в шапке дашборда: имя, дата «Сегодня, N месяц» и кнопка добавления */
export default function Greeting({ name, onAdd }: GreetingProps) {
  const now = new Date();
  const dateLabel = `Сегодня, ${now.getDate()} ${MONTHS[now.getMonth()]}`;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
          Привет, {name}!{" "}
          <span className="whitespace-nowrap">Сегодня отличный день для прогресса 💪</span>
        </h1>
        <p className="mt-2 text-ink-soft">{dateLabel}</p>
      </div>
      <Button
        variant="accent"
        size="lg"
        onClick={onAdd}
        data-metrica="goal:dashboard-add-habit"
      >
        + Добавить привычку
      </Button>
    </div>
  );
}