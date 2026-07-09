import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const Typography = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.ink,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.ink,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.ink,
    lineHeight: 24,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    color: Colors.text,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 19,
    fontWeight: '400',
    color: Colors.text,
    lineHeight: 27,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  button: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 0.2,
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const TouchTargetMin = 48;
