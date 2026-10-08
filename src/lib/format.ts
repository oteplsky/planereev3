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
