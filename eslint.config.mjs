import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Font system enforcement rules
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['next/font/google', 'next/font/local'],
              message:
                'Font imports are not allowed. Use the semantic font system with CSS variables and Tailwind classes instead. See documentation/TYPOGRAPHY_SYSTEM_2025.md for guidelines.',
            },
          ],
        },
      ],
      // Custom rules for color and font system enforcement
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/text-(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-(50|100|200|300|400|500|600|700|800|900|950)/]',
          message:
            'Hard-coded text colors are not allowed. Use semantic tokens like "text-error-foreground", "text-success-foreground", etc. See documentation/AGENT_STYLING_RULES.md for guidelines.',
        },
        {
          selector:
            'Literal[value=/bg-(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-(50|100|200|300|400|500|600|700|800|900|950)/]',
          message:
            'Hard-coded background colors are not allowed. Use semantic tokens like "bg-error-subtle", "bg-success-subtle", etc. See documentation/AGENT_STYLING_RULES.md for guidelines.',
        },
        {
          selector:
            'Literal[value=/border-(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-(50|100|200|300|400|500|600|700|800|900|950)/]',
          message:
            'Hard-coded border colors are not allowed. Use semantic tokens like "border-error-border", "border-success-border", etc. See documentation/AGENT_STYLING_RULES.md for guidelines.',
        },
        {
          selector:
            'Literal[value=/dark:text-(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-(50|100|200|300|400|500|600|700|800|900|950)/]',
          message:
            'Manual dark mode color variants are not allowed with semantic tokens. Semantic tokens automatically adapt to dark mode. Remove the "dark:" prefix.',
        },
        {
          selector:
            'Literal[value=/dark:bg-(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-(50|100|200|300|400|500|600|700|800|900|950)/]',
          message:
            'Manual dark mode color variants are not allowed with semantic tokens. Semantic tokens automatically adapt to dark mode. Remove the "dark:" prefix.',
        },
        {
          selector:
            'Literal[value=/dark:border-(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-(50|100|200|300|400|500|600|700|800|900|950)/]',
          message:
            'Manual dark mode color variants are not allowed with semantic tokens. Semantic tokens automatically adapt to dark mode. Remove the "dark:" prefix.',
        },
        // Font system enforcement rules
        {
          selector:
            'Literal[value=/font-\\[((?!font-(interface|heading|body|code|reading|display|foreign-word|phonetic|definition|translation)).)*\\]/]',
          message:
            'Hard-coded font families are not allowed. Use semantic font classes like "font-heading", "font-body", "font-code", etc. See documentation/TYPOGRAPHY_SYSTEM_2025.md for full reference.',
        },
        {
          selector:
            'Property[key.name="fontFamily"] > Literal[value!=/^var\\(--font-(interface|heading|body|code|reading|display|foreign-word|phonetic|definition|translation)\\)$/]',
          message:
            'Inline font-family styles must use CSS variables. Use var(--font-heading), var(--font-body), etc. or use Tailwind font classes instead. See documentation/TYPOGRAPHY_SYSTEM_2025.md for guidelines.',
        },
        {
          selector:
            'Literal[value=/^font-(inter|roboto|open-sans|lato|source-sans|poppins|nunito|montserrat|pt-sans|ubuntu|arial|helvetica|times|georgia|courier)$/]',
          message:
            'Specific font family classes are not allowed. Use semantic font classes like "font-heading", "font-body", "font-code", etc. instead. See documentation/TYPOGRAPHY_SYSTEM_2025.md for guidelines.',
        },
      ],
    },
  },
];

export default eslintConfig;
