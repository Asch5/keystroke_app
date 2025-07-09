/**
 * KEYSTROKE APP TYPOGRAPHY SYSTEM 2025
 * =====================================
 *
 * Modern font system optimized for:
 * - Zero loading time (system fonts)
 * - Perfect cross-platform rendering
 * - Semantic font classification
 * - Accessibility and readability
 * - Performance optimization
 */

/**
 * SYSTEM FONT STACKS
 * Based on modernfontstacks.com classification system
 */

// Primary UI Font - Modern Neo-Grotesque
export const systemFontStack = {
  primary: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif`,

  // Alternative: Neo-Grotesque (Inter-style)
  neogrotesque: `Inter, Roboto, "Helvetica Neue", "Arial Nova", "Nimbus Sans", Arial, sans-serif`,

  // Geometric Humanist (for headings)
  geometric: `Avenir, Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif`,

  // Humanist (for body text)
  humanist: `Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif`,

  // Monospace Code
  monospace: `ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace`,

  // Reading (serif for long content)
  reading: `Charter, "Bitstream Charter", "Sitka Text", Cambria, serif`,

  // Display (for large headings)
  display: `ui-rounded, "Hiragino Maru Gothic ProN", Quicksand, Comfortaa, Manjari, "Arial Rounded MT Bold", Calibri, source-sans-pro, sans-serif`,
};

/**
 * SEMANTIC FONT CLASSIFICATION
 * Maps design intent to appropriate font stacks
 */
export const fontPurpose = {
  // UI Elements
  interface: systemFontStack.primary,
  navigation: systemFontStack.primary,
  buttons: systemFontStack.primary,
  forms: systemFontStack.primary,

  // Content Hierarchy
  heading: systemFontStack.geometric,
  subheading: systemFontStack.humanist,
  body: systemFontStack.humanist,
  caption: systemFontStack.primary,

  // Specialized
  code: systemFontStack.monospace,
  data: systemFontStack.monospace,
  reading: systemFontStack.reading,
  display: systemFontStack.display,

  // Language Learning Specific
  foreignWord: systemFontStack.reading, // Better for language readability
  phonetic: systemFontStack.monospace, // Consistent character spacing
  definition: systemFontStack.humanist, // Readable for comprehension
  translation: systemFontStack.humanist,
};

/**
 * FONT WEIGHTS
 * Semantic weight mapping for consistent typography
 */
export const fontWeight = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

/**
 * FONT SIZES
 * Responsive scale using modern CSS units
 */
export const fontSize = {
  xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
  sm: 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
  base: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
  lg: 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
  xl: 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
  '2xl': 'clamp(1.5rem, 1.3rem + 1vw, 1.875rem)',
  '3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.25rem)',
  '4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
  '5xl': 'clamp(3rem, 2.5rem + 2.5vw, 4rem)',
} as const;

/**
 * LINE HEIGHTS
 * Optimized for readability across different content types
 */
export const lineHeight = {
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '1.75',
  reading: '1.7', // Optimal for long-form content
} as const;

/**
 * UTILITY FUNCTIONS
 */
export const getFontForPurpose = (
  purpose: keyof typeof fontPurpose,
): string => {
  return fontPurpose[purpose];
};

export const createFontFamily = (
  purpose: keyof typeof fontPurpose,
  customFonts: string[] = [],
): string => {
  const systemStack = fontPurpose[purpose];
  if (customFonts.length === 0) return systemStack;

  return `${customFonts.map((font) => `"${font}"`).join(', ')}, ${systemStack}`;
};

/**
 * CSS CUSTOM PROPERTIES HELPER
 * For use in CSS files or styled-components
 */
export const fontCssVariables = {
  // Font Families
  '--font-interface': fontPurpose.interface,
  '--font-heading': fontPurpose.heading,
  '--font-body': fontPurpose.body,
  '--font-code': fontPurpose.code,
  '--font-reading': fontPurpose.reading,
  '--font-display': fontPurpose.display,

  // Font Weights
  '--font-weight-light': fontWeight.light,
  '--font-weight-normal': fontWeight.normal,
  '--font-weight-medium': fontWeight.medium,
  '--font-weight-semibold': fontWeight.semibold,
  '--font-weight-bold': fontWeight.bold,

  // Font Sizes
  '--font-size-xs': fontSize.xs,
  '--font-size-sm': fontSize.sm,
  '--font-size-base': fontSize.base,
  '--font-size-lg': fontSize.lg,
  '--font-size-xl': fontSize.xl,
  '--font-size-2xl': fontSize['2xl'],
  '--font-size-3xl': fontSize['3xl'],
  '--font-size-4xl': fontSize['4xl'],
  '--font-size-5xl': fontSize['5xl'],

  // Line Heights
  '--line-height-tight': lineHeight.tight,
  '--line-height-normal': lineHeight.normal,
  '--line-height-relaxed': lineHeight.relaxed,
  '--line-height-reading': lineHeight.reading,
} as const;

/**
 * PERFORMANCE OPTIMIZATIONS
 * Font loading optimizations and browser hints
 */
export const fontOptimizations = {
  // Preload system fonts (if needed for custom CSS)
  preloadFonts: false, // System fonts don't need preloading

  // Font display strategy (not needed for system fonts)
  fontDisplay: 'auto' as const,

  // Font feature settings for enhanced typography
  fontFeatureSettings: {
    ligatures: '"liga", "clig"',
    kerning: '"kern"',
    numerals: '"tnum"', // Tabular numerals for data
  },
} as const;

// Export font variables for CSS usage
export default fontCssVariables;
