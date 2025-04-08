import { Metadata } from 'next';
import { geistSans, geistMono } from '@/components/ui/fonts';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import AuthProvider from '@/components/AuthProvider';
import { ReduxProvider } from '@/components/ReduxProvider';

export const metadata: Metadata = {
  title: {
    default: 'Keystroke App',
    template: '%s | Keystroke App',
  },
  description:
    'This is an application to help in learning to type foreign language words on the keyboard it helps in learning the language in learning new words and also developing typing skills',
};

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
              defaultTheme="system"
              storageKey="ui-theme"
              enableSystem
              attribute="class"
            >
              {children}
            </ThemeProvider>
          </ReduxProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
