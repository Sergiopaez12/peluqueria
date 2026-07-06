/**
 * Paleta: Azul Marino Elegante
 * Fondo oscuro azul profundo, acentos en celeste y blanco.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#EFF4FB',
    backgroundSelected: '#D6E4F7',
    textSecondary: '#4A6080',
  },
  dark: {
    text: '#E8F0FE',
    background: '#060D1F',
    backgroundElement: '#0D1B35',
    backgroundSelected: '#172D50',
    textSecondary: '#7A9CC6',
  },
} as const;

// Paleta centralizada azul marino
export const Navy = {
  // Fondos
  bg: '#060D1F',           // Fondo principal — azul medianoche
  surface: '#0D1B35',      // Cards / superficies
  surfaceAlt: '#112040',   // Inputs / elementos secundarios

  // Acentos
  accent: '#38BDF8',       // Celeste brillante (sky-400)
  accentDark: '#0EA5E9',   // Celeste más profundo (sky-500)
  accentGlow: 'rgba(56,189,248,0.15)', // Brillo del acento

  // Texto
  textPrimary: '#E8F0FE',  // Blanco azulado
  textSecondary: '#7A9CC6',// Gris azulado
  textMuted: '#3D5A80',    // Texto muy apagado

  // Bordes
  border: 'rgba(56,189,248,0.12)',
  borderAccent: 'rgba(56,189,248,0.4)',

  // Estados
  success: '#10b981',
  successBg: 'rgba(16,185,129,0.1)',
  error: '#f87171',
  errorBg: 'rgba(248,113,113,0.1)',
  warning: '#fbbf24',
  warningBg: 'rgba(251,191,36,0.1)',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
