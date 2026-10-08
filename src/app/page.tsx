// Temporary token check for Step 0. Replaced by the Library in Step 2.
const swatches = [
  ["bg-action", "Синий · действие"],
  ["bg-light", "Светлый · пространство"],
  ["bg-lime", "Лайм · жизнь"],
  ["bg-pink-lighter", "Розовый"],
  ["bg-coral-lighter", "Коралловый"],
  ["bg-orange-lighter", "Оранжевый"],
  ["bg-yellow-lighter", "Жёлтый"],
  ["bg-green-lighter", "Зелёный"],
  ["bg-teal-lighter", "Бирюзовый"],
  ["bg-blue-lighter", "Синий"],
  ["bg-violet-lighter", "Фиолетовый"],
] as const;

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-8 py-16">
      <h1 className="text-display">Планируй больше</h1>
      <p className="mt-2 text-body-lg text-ink-secondary">
        Шаг 0: токены Planeree UI kit подключены.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <button className="h-10 rounded-sm bg-action px-4 font-semibold text-white transition-colors duration-[120ms] hover:bg-action-hover active:bg-action-pressed">
          Создать урок
        </button>
        <button className="h-10 rounded-sm bg-light px-4 font-semibold transition-colors duration-[120ms] hover:bg-light-hover active:bg-light-pressed">
          Настроить
        </button>
        <button className="h-10 rounded-sm px-4 font-semibold transition-colors duration-[120ms] hover:bg-light">
          Отмена
        </button>
        <button className="h-10 rounded-sm bg-danger px-4 font-semibold text-white transition-colors duration-[120ms] hover:bg-danger-hover">
          Удалить
        </button>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {swatches.map(([cls, label]) => (
          <div
            key={cls}
            className="rounded-lg border border-line p-3 transition-colors hover:border-line-strong"
          >
            <div className={`h-16 rounded-sm ${cls}`} />
            <p className="mt-2 text-caption text-ink-secondary">{label}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
