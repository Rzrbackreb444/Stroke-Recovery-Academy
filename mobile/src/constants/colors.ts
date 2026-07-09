export const Colors = {
  cream: '#FDFBF7',
  ink: '#2A2421',
  inkLight: '#1C1917',
  orange: '#C06B3E',
  orangeDark: '#E2741B',
  gold: '#C9941A',
  muted: '#EDE8E1',
  mutedFg: '#78716C',
  stone: '#FAF8F3',
  white: '#FFFFFF',
  danger: '#DC2626',
  success: '#16A34A',
  crisis: '#7C3AED',
  crisisLight: '#EDE9FE',

  background: '#FDFBF7',
  surface: '#FAF8F3',
  border: '#E5DDD4',
  text: '#2A2421',
  textSecondary: '#78716C',
  textTertiary: '#A8A29E',
  primary: '#C06B3E',
  primaryFg: '#FFFFFF',
  accent: '#E2741B',
} as const;

export type ColorKey = keyof typeof Colors;
