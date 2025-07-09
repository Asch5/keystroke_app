import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', 'class'],
  theme: {
    extend: {
      /* ================================
       * 2025 MODERN TYPOGRAPHY SYSTEM
       * ================================ */
      fontFamily: {
        // System font stacks - zero loading time
        interface: 'var(--font-interface)',
        heading: 'var(--font-heading)',
        body: 'var(--font-body)',
        code: 'var(--font-code)',
        reading: 'var(--font-reading)',
        display: 'var(--font-display)',

        // Semantic purposes for language learning
        'foreign-word': 'var(--font-foreign-word)',
        phonetic: 'var(--font-phonetic)',
        definition: 'var(--font-definition)',
        translation: 'var(--font-translation)',

        // Legacy compatibility (will be removed)
        sans: 'var(--font-interface)',
        mono: 'var(--font-code)',
      },

      fontSize: {
        // Responsive, fluid typography
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
        '4xl': 'var(--font-size-4xl)',
        '5xl': 'var(--font-size-5xl)',
      },

      fontWeight: {
        light: 'var(--font-weight-light)',
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
        extrabold: 'var(--font-weight-extrabold)',
        black: 'var(--font-weight-black)',
      },

      lineHeight: {
        tight: 'var(--line-height-tight)',
        snug: 'var(--line-height-snug)',
        normal: 'var(--line-height-normal)',
        relaxed: 'var(--line-height-relaxed)',
        loose: 'var(--line-height-loose)',
        reading: 'var(--line-height-reading)',
      },

      letterSpacing: {
        tight: 'var(--letter-spacing-tight)',
        normal: 'var(--letter-spacing-normal)',
        wide: 'var(--letter-spacing-wide)',
        wider: 'var(--letter-spacing-wider)',
        widest: 'var(--letter-spacing-widest)',
      },

      colors: {
        // ================================
        // SHADCN/UI COLORS (EXISTING)
        // ================================
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          '50': '#f0f9ff',
          '100': '#e0f2fe',
          '200': '#bae6fd',
          '300': '#7dd3fc',
          '400': '#38bdf8',
          '500': '#0ea5e9',
          '600': '#0284c7',
          '700': '#0369a1',
          '800': '#075985',
          '900': '#0c4a6e',
          '950': '#082f49',
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        chart: {
          '1': 'var(--chart-1)',
          '2': 'var(--chart-2)',
          '3': 'var(--chart-3)',
          '4': 'var(--chart-4)',
          '5': 'var(--chart-5)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
          background: 'var(--sidebar-background)',
        },

        // ================================
        // ENHANCED SEMANTIC COLOR TOKENS SYSTEM (2025 OPTIMIZED)
        // ================================

        // STATUS & FEEDBACK COLORS
        success: {
          DEFAULT: 'var(--semantic-success)',
          subtle: 'var(--semantic-success-subtle)',
          border: 'var(--semantic-success-border)',
          foreground: 'var(--semantic-success-foreground)',
        },
        error: {
          DEFAULT: 'var(--semantic-error)',
          subtle: 'var(--semantic-error-subtle)',
          border: 'var(--semantic-error-border)',
          foreground: 'var(--semantic-error-foreground)',
        },
        warning: {
          DEFAULT: 'var(--semantic-warning)',
          subtle: 'var(--semantic-warning-subtle)',
          border: 'var(--semantic-warning-border)',
          foreground: 'var(--semantic-warning-foreground)',
        },
        info: {
          DEFAULT: 'var(--semantic-info)',
          subtle: 'var(--semantic-info-subtle)',
          border: 'var(--semantic-info-border)',
          foreground: 'var(--semantic-info-foreground)',
        },

        // 2025 TRENDING COLORS
        teal: {
          primary: 'var(--teal-primary)',
          subtle: 'var(--teal-subtle)',
          foreground: 'var(--teal-foreground)',
        },
        sage: {
          primary: 'var(--sage-primary)',
          subtle: 'var(--sage-subtle)',
          foreground: 'var(--sage-foreground)',
        },
        coral: {
          primary: 'var(--coral-primary)',
          subtle: 'var(--coral-subtle)',
          foreground: 'var(--coral-foreground)',
        },
        lavender: {
          primary: 'var(--lavender-primary)',
          subtle: 'var(--lavender-subtle)',
          foreground: 'var(--lavender-foreground)',
        },

        // DIFFICULTY LEVELS
        difficulty: {
          elementary: {
            DEFAULT: 'var(--difficulty-elementary)',
            subtle: 'var(--difficulty-elementary-subtle)',
            foreground: 'var(--difficulty-elementary-foreground)',
          },
          intermediate: {
            DEFAULT: 'var(--difficulty-intermediate)',
            subtle: 'var(--difficulty-intermediate-subtle)',
            foreground: 'var(--difficulty-intermediate-foreground)',
          },
          advanced: {
            DEFAULT: 'var(--difficulty-advanced)',
            subtle: 'var(--difficulty-advanced-subtle)',
            foreground: 'var(--difficulty-advanced-foreground)',
          },
          proficient: {
            DEFAULT: 'var(--difficulty-proficient)',
            subtle: 'var(--difficulty-proficient-subtle)',
            foreground: 'var(--difficulty-proficient-foreground)',
          },
        },

        // PRACTICE GAME COLORS
        practice: {
          typing: {
            DEFAULT: 'var(--practice-typing)',
            subtle: 'var(--practice-typing-subtle)',
            foreground: 'var(--practice-typing-foreground)',
          },
          'multiple-choice': {
            DEFAULT: 'var(--practice-multiple-choice)',
            subtle: 'var(--practice-multiple-choice-subtle)',
            foreground: 'var(--practice-multiple-choice-foreground)',
          },
          flashcard: {
            DEFAULT: 'var(--practice-flashcard)',
            subtle: 'var(--practice-flashcard-subtle)',
            foreground: 'var(--practice-flashcard-foreground)',
          },
          audio: {
            DEFAULT: 'var(--practice-audio)',
            subtle: 'var(--practice-audio-subtle)',
            foreground: 'var(--practice-audio-foreground)',
          },
        },

        // LEARNING STATUS COLORS
        status: {
          'not-started': {
            DEFAULT: 'var(--status-not-started)',
            subtle: 'var(--status-not-started-subtle)',
            foreground: 'var(--status-not-started-foreground)',
          },
          'in-progress': {
            DEFAULT: 'var(--status-in-progress)',
            subtle: 'var(--status-in-progress-subtle)',
            foreground: 'var(--status-in-progress-foreground)',
          },
          learned: {
            DEFAULT: 'var(--status-learned)',
            subtle: 'var(--status-learned-subtle)',
            foreground: 'var(--status-learned-foreground)',
          },
          'needs-review': {
            DEFAULT: 'var(--status-needs-review)',
            subtle: 'var(--status-needs-review-subtle)',
            foreground: 'var(--status-needs-review-foreground)',
          },
          difficult: {
            DEFAULT: 'var(--status-difficult)',
            subtle: 'var(--status-difficult-subtle)',
            foreground: 'var(--status-difficult-foreground)',
          },
        },

        // ENHANCED CONTENT HIERARCHY
        content: {
          subtle: 'var(--content-subtle)',
          soft: 'var(--content-soft)',
          border: 'var(--content-border)',
          secondary: 'var(--content-secondary)',
          tertiary: 'var(--content-tertiary)',
        },

        // 2025 MODERN ACCENTS
        modern: {
          sage: {
            DEFAULT: 'var(--modern-sage)',
            subtle: 'var(--modern-sage-subtle)',
            foreground: 'var(--modern-sage-foreground)',
          },
          slate: {
            DEFAULT: 'var(--modern-slate)',
            subtle: 'var(--modern-slate-subtle)',
            foreground: 'var(--modern-slate-foreground)',
          },
          warm: {
            DEFAULT: 'var(--modern-warm)',
            subtle: 'var(--modern-warm-subtle)',
            foreground: 'var(--modern-warm-foreground)',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
} satisfies Config;
