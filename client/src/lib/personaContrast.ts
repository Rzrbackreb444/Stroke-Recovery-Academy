const FALLBACK_GOLD = "#C9941A";

function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "");
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return [r, g, b];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const transform = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

export function safeAccentForDark(
  color: string | null | undefined,
  fallback: string = FALLBACK_GOLD,
): string {
  if (!color || typeof color !== "string") return fallback;
  const rgb = hexToRgb(color);
  if (!rgb) return fallback;
  return relativeLuminance(rgb) >= 0.18 ? color : fallback;
}
