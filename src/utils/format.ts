export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 2)} kg`;
  }
  return `${grams} g`;
}

export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter((v) => v.trim() !== ''))).sort((a, b) => a.localeCompare(b, 'de'));
}
