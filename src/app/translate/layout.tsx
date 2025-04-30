import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Translation API Tester',
  description:
    'Test the extended-google-translate-api package with various options',
};

export default function TranslateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
