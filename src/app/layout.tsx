// src/app/layout.tsx
import type { Metadata } from 'next';
import React from 'react';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ardhyanovri.my.id';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Systems Engineering Lab | Ardhya Novri Ramadhan',
    template: '%s | Ardhya Novri Ramadhan',
  },
  description:
    'First-principles Rust 2024 & WASM32-SIMD128 Systems Engineering Workbench: VectraDB, KronosLOB, AegisBox, NovaServe, and SpectreMesh.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          backgroundColor: '#05070e',
          color: '#f8fafc',
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {children}
      </body>
    </html>
  );
}
