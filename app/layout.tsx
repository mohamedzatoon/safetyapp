import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BuildSafe AI',
  description: 'Construction safety inspection workflow demo',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
