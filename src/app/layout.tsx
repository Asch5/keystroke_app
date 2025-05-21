import type { Metadata, Viewport } from 'next';
import { geistSans, geistMono } from '@/components/ui/fonts';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import AuthProvider from '@/components/AuthProvider';
import { ReduxProvider } from '@/components/ReduxProvider';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: {
    default: 'Keystroke App',
    template: '%s | Keystroke App',
  },
  description:
    'This is an application to help in learning to type foreign language words on the keyboard it helps in learning the language in learning new words and also developing typing skills',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/**
 * Root layout for the application.
 * Sets up the HTML structure, global styles, fonts, and context providers.
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background font-sans`}
      >
        <AuthProvider>
          <ReduxProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </ReduxProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
