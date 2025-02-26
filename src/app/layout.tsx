import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import AuthProvider from '@/components/AuthProvider';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Keystroke App',
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
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <AuthProvider>
                    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
                        {children}
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
