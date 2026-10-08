/** Russian plural: plural(5, ["урок", "урока", "уроков"]) → "уроков". */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export const count = (n: number, forms: [string, string, string]) => `${n} ${plural(n, forms)}`;

export const LESSONS: [string, string, string] = ["урок", "урока", "уроков"];
export const TEXTBOOKS: [string, string, string] = ["учебник", "учебника", "учебников"];
export const MATERIALS: [string, string, string] = ["материал", "материала", "материалов"];
export const MEMBERS: [string, string, string] = ["участник", "участника", "участников"];

const dayMonth = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const dayMonthYear = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** «сегодня», «вчера», «5 октября», or «5 октября 2025 г.» for other years. */
export function formatDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (days === 0) return "сегодня";
  if (days === 1) return "вчера";
  return (date.getFullYear() === now.getFullYear() ? dayMonth : dayMonthYear).format(date);
}
