/* =========================================================================
   THEME CONSTANTS — Programmatic mirror of index.css @theme tokens
   Use these in TS/JS code when you need runtime access to design values
   (e.g. chart colors, dynamic inline styles, canvas drawing).

   For CSS styling ALWAYS prefer the classes defined in index.css utilities
   or the Tailwind token classes, NEVER hard-code hex values directly.
   ========================================================================= */

export const THEME = {
  fonts: {
    sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
    body: '"Inter", ui-sans-serif, system-ui, sans-serif',
    headline: '"Manrope", "Inter", ui-sans-serif, sans-serif',
    display: '"Manrope", "Inter", ui-sans-serif, sans-serif',
    mono: '"JetBrains Mono", ui-monospace, monospace',
  },

  typography: {
    fsH1: '2.5rem',
    fsH2: '1.875rem',
    fsH3: '1.5rem',
    fsH4: '1.25rem',
    fsH5: '1.125rem',
    fsH6: '1rem',
    fsBodyLg: '1rem',
    fsBody: '0.875rem',
    fsBodySm: '0.75rem',
    fsXs: '0.6875rem',
    fsTiny: '0.625rem',

    lhH1: 1.15,
    lhH2: 1.2,
    lhH3: 1.25,
    lhH4: 1.3,
    lhH5: 1.35,
    lhH6: 1.4,
    lhBodyLg: 1.55,
    lhBody: 1.55,
    lhBodySm: 1.5,
    lhXs: 1.45,
    lhTiny: 1.4,

    lsTight: '-0.02em',
    lsSnug: '-0.01em',
    lsNormal: '0em',
    lsWide: '0.05em',
    lsWider: '0.1em',
    lsWidest: '0.15em',

    fwRegular: 400,
    fwMedium: 500,
    fwSemibold: 600,
    fwBold: 700,
    fwExtrabold: 800,
  },

  colors: {
    primary: '#00478d',
    primaryOn: '#ffffff',
    primaryContainer: '#005eb8',
    primaryContainerOn: '#ffffff',

    secondary: '#2b6485',
    secondaryOn: '#ffffff',
    secondaryContainer: '#a3d8fe',

    tertiary: '#005148',
    tertiaryOn: '#ffffff',
    tertiaryContainer: '#006b60',
    tertiaryContainerOn: '#ffffff',

    success: '#15803d',
    successOn: '#ffffff',
    successContainer: '#dcfce7',

    warning: '#b45309',
    warningOn: '#ffffff',
    warningContainer: '#fef3c7',

    error: '#ba1a1a',
    errorOn: '#ffffff',
    errorContainer: '#ffdad6',

    info: '#0369a1',
    infoOn: '#ffffff',
    infoContainer: '#e0f2fe',

    surface: '#f8f9fa',
    surfaceOn: '#191c1d',
    surfaceLowest: '#ffffff',
    surfaceLow: '#f3f4f5',
    surfaceContainer: '#edeeef',
    surfaceContainerHigh: '#e7e8e9',
    surfaceContainerHighest: '#e1e3e4',
    surfaceVariant: '#e2e4ea',
    surfaceVariantOn: '#424752',

    outline: '#727783',
    outlineVariant: '#c2c6d4',

    slate55: '#f8fafc',
    slate150: '#e2e8f0',
    slate350: '#cbd5e1',
    slate505: '#6b7280',
    slate550: '#64748b',
    slate850: '#1e293b',

    blue150: '#dbeafe',
    blue650: '#2563eb',
    blue850: '#1e3a8a',
    blue950: '#172554',

    red550: '#ef4444',
    red650: '#dc2626',

    clinicalCoverage: {
      bg: '#eef8f7',
      border: '#d6ebe9',
      text: '#003831',
      cta: '#006b60',
    },
  },

  radii: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    xxl: '1.5rem',
    xxxl: '2rem',
    full: '9999px',
  },

  shadows: {
    card: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
    cardHover: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
    elevated: '0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
    modal: '0 25px 50px -12px rgb(0 0 0 / 0.20)',
    primaryGlow: '0 4px 10px -2px rgb(0 94 184 / 0.25)',
    sidebar: '0 10px 30px -10px rgb(15 23 42 / 0.15)',
  },

  easings: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  },

  durations: {
    fast: 120,
    base: 200,
    soft: 250,
    slow: 300,
    deliberate: 400,
  },

  zIndex: {
    base: 1,
    sticky: 30,
    header: 40,
    sidebar: 40,
    drawer: 45,
    dropdown: 50,
    popover: 50,
    tooltip: 150,
    toast: 100,
    modalOverlay: 199,
    modal: 200,
  },

  layout: {
    sidebarWidth: '18rem',
    headerHeight: '4.5rem',
    contentMaxWidth: '80rem',
  },
} as const;

/* --------------------------------------------------------------------------
   BADGE / STATUS MAPS — common helpers for list views & tables
   -------------------------------------------------------------------------- */

export const BADGE_TONE = {
  info: 'badge-info',
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  neutral: 'badge-neutral',
  teal: 'badge-teal',
  purple: 'badge-purple',
  indigo: 'badge-indigo',
  sky: 'badge-sky',
} as const;

export type BadgeToneKey = keyof typeof BADGE_TONE;

export const ICON_BOX_TONE = {
  primary: 'icon-box-primary',
  success: 'icon-box-success',
  warning: 'icon-box-warning',
  danger: 'icon-box-danger',
  teal: 'icon-box-teal',
  purple: 'icon-box-purple',
  indigo: 'icon-box-indigo',
  sky: 'icon-box-sky',
  neutral: 'icon-box-neutral',
} as const;

export type IconBoxToneKey = keyof typeof ICON_BOX_TONE;

/* Request status → badge tone & helper mapping, consistent across modules. */
export const STATUS_TONE_MAP: Record<string, BadgeToneKey> = {
  Pending: 'info',
  'Under Review': 'warning',
  'Urgent Review': 'danger',
  Approved: 'success',
  Rejected: 'danger',
  Draft: 'neutral',
  Review: 'info',
  review: 'info',
  draft: 'warning',
  approved: 'success',

  AVAILABLE: 'teal',
  'IN USE': 'danger',
  MAINTENANCE: 'warning',
  RESERVED: 'indigo',
  BLOCKED: 'neutral',
};

/* --------------------------------------------------------------------------
   HELPER: Read a CSS custom property at runtime from :root
   Useful when you need the raw computed value inside React effects
   (e.g. charting libraries that only accept hex strings).
   -------------------------------------------------------------------------- */
export function getCssVar(name: string, fallback = ''): string {
  if (typeof window === 'undefined') return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

/* Re-export convenient alias so components can import a compact theme object. */
export default THEME;
