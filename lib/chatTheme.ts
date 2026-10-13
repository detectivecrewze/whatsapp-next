const DEFAULT_LIGHT_BUBBLE = '#d9fdd3';

function parseHexColor(color: string): [number, number, number] | null {
  const normalized = color.trim().replace(/^#/, '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((character) => character + character).join('')
    : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) return null;

  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
  ];
}

export function usesLightChatTheme(bubbleColor?: string | null): boolean {
  const [red, green, blue] = parseHexColor(bubbleColor || DEFAULT_LIGHT_BUBBLE) ?? [217, 253, 211];
  const toLinear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * toLinear(red) + 0.7152 * toLinear(green) + 0.0722 * toLinear(blue);

  return luminance >= 0.5;
}
