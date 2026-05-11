import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Primary Brand
  primary:    '#F97316',   // Bold orange
  primaryDark:'#C2410C',
  primaryLight:'#FED7AA',

  // Backgrounds
  bg:         '#0A0A0F',   // Near black
  bgCard:     '#14141C',
  bgElevated: '#1C1C28',
  bgInput:    '#1E1E2E',
  border:     '#2A2A3E',

  // Text
  textPrimary: '#F8FAFC',
  textSec:     '#94A3B8',
  textMuted:   '#475569',
  textInverse: '#0A0A0F',

  // Semantic
  success:    '#22C55E',
  successBg:  '#14291E',
  danger:     '#EF4444',
  dangerBg:   '#2A1414',
  warning:    '#F59E0B',
  warningBg:  '#2A2110',
  info:       '#38BDF8',
  infoBg:     '#0F2030',

  // Chart colors
  chartPrimary:  '#F97316',
  chartSecondary:'#38BDF8',
  chartTertiary: '#A78BFA',
  chartQuaternary:'#34D399',

  white: '#FFFFFF',
  black: '#000000',
};

export const FONTS = {
  // Using Expo built-in system fonts
  regular:    'System',
  medium:     'System',
  bold:       'System',
  sizes: {
    xs:   10,
    sm:   12,
    base: 14,
    md:   16,
    lg:   18,
    xl:   20,
    '2xl':24,
    '3xl':30,
    '4xl':36,
  },
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  12,
  base:16,
  lg:  20,
  xl:  24,
  '2xl':32,
  '3xl':48,
};

export const RADIUS = {
  sm:  6,
  md:  10,
  lg:  14,
  xl:  20,
  full:999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const SCREEN = { width, height };

// Common reusable styles
export const COMMON = {
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
};
