import type { Metadata, Viewport } from 'next';
import './globals.css';
import {
  ThemeProvider,
  AuthProvider,
  ReduxProvider,
} from '@/components/providers';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { Toaster } from '@/components/ui/sonner';
import { SpeedInsights } from '@/components/shared/SpeedInsights';
import { PerformanceMonitoringProvider } from '@/components/providers/PerformanceMonitoringProvider';

export const metadata: Metadata = {
  title: {
    default: 'Keystroke App',
    template: '%s | Keystroke App',
  },
  description:
    'This is an application to help in learning to type foreign language words on the keyboard it helps in learning the language in learning new words and also developing typing skills',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

/**
 * Root layout for the application.
 * Sets up the HTML structure, global styles, modern font system, and context providers.
 * Includes Vercel Speed Insights for comprehensive performance monitoring.
 *
 * FONT SYSTEM 2025:
 * - Uses modern system font stacks for zero loading time
 * - Semantic font classification for language learning
 * - Responsive typography with fluid scaling
 * - Optimized for readability and accessibility
 *
 * @param {Readonly<{ children: React.ReactNode }>} props - Props for the component.
 * @param {React.ReactNode} props.children - The child components to render within the layout.
 * @returns {JSX.Element} The root layout structure.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background font-interface">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReduxProvider>
            <AuthProvider>
              <SettingsProvider>
                <PerformanceMonitoringProvider>
                  {children}
                  <Toaster />
                  <SpeedInsights />
                </PerformanceMonitoringProvider>
              </SettingsProvider>
            </AuthProvider>
          </ReduxProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
