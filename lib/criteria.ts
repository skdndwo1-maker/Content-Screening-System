import { toCriteriaGroups, normalizeCriteriaCode, getTaxonomyItem } from "./taxonomy";

export const defaultCriteriaGroups = toCriteriaGroups();

export const criteriaKoMap: Record<string, string> = Object.fromEntries(
  defaultCriteriaGroups.flatMap(g =>
    g.items.flatMap(i => {
      const pairs: [string, string][] = [[i.k, i.ko]];
      return pairs;
    })
  )
);

export function criteriaLabel(code: string): string {
  const normalized = normalizeCriteriaCode(code);
  return criteriaKoMap[normalized] || getTaxonomyItem(normalized)?.name_ko || code;
}
