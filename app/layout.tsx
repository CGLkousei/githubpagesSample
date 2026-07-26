import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Counter App',
  description: 'React + Next.js で作るカウンターアプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
