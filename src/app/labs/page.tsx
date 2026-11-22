// src/app/labs/page.tsx
import type { Metadata } from 'next';
import { OG_ACCENTS } from './og-utils';
import { fetchAllLabsTelemetry } from './telemetry';
import { GITHUB_OWNER, LAB_BLUEPRINTS } from './types';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Systems Engineering Lab — Live Rust/WASM Benchmarks',
  description:
    'Interactive 60 FPS WebWorker WASM32 studios for DST-KV (Live), VectraDB, KronosLOB, AegisBox, NovaServe, and SpectreMesh.',
  alternates: {
    canonical: '/labs',
  },
  openGraph: {
    type: 'website',
    url: '/labs',
    title: 'Systems Engineering Lab — 6-Engine Rust/WASM Multi-Zone Architecture',
    description:
      'First-principles Rust & WebAssembly Systems Engineering Lab with explicit VERIFIED LIVE vs STANDBY PROBE provenance.',
    siteName: 'Ardhya Novri Ramadhan',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Systems Engineering Lab — 6-Engine Rust/WASM Multi-Zone Architecture',
    description:
      'First-principles Rust & WebAssembly Systems Engineering Lab with explicit VERIFIED LIVE vs STANDBY PROBE provenance.',
  },
};

export default async function LabsIndexPage() {
  const telemetryMap = await fetchAllLabsTelemetry();
  const liveCount = LAB_BLUEPRINTS.filter(
    (lab) => telemetryMap[lab.slug].provenance === 'VERIFIED_LIVE'
  ).length;
  const probeCount = LAB_BLUEPRINTS.length - liveCount;

  return (
    <main
      style={{
        maxWidth: '1120px',
        margin: '0 auto',
        padding: '48px 24px 72px',
      }}
    >
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '16px',
          borderBottom: '1px solid #1e293b',
          paddingBottom: '24px',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: '12px',
              color: '#60a5fa',
              letterSpacing: '0.06em',
            }}
          >
            RUST 2024 · WASM32-SIMD128 MULTI-ZONE LABS
          </p>
          <h1
            style={{
              margin: '8px 0 6px',
              fontSize: '36px',
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}
          >
            Systems Engineering Lab
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '15px' }}>
            {liveCount}/{LAB_BLUEPRINTS.length} VERIFIED LIVE · {probeCount}/{LAB_BLUEPRINTS.length} STANDBY PROBE · GitHub:{' '}
            <code style={{ color: '#e2e8f0' }}>@{GITHUB_OWNER}</code>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="/"
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid #1e293b',
              backgroundColor: '#0b0f19',
              color: '#cbd5e1',
              textDecoration: 'none',
              fontSize: '13px',
            }}
          >
            Open Graph Inspector
          </a>
          <a
            href="/labs/opengraph-image"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '9px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.45)',
              backgroundColor: 'rgba(37, 99, 235, 0.16)',
              color: '#93c5fd',
              textDecoration: 'none',
              fontSize: '13px',
            }}
          >
            View /labs/opengraph-image ↗
          </a>
        </div>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '16px',
          marginTop: '28px',
        }}
      >
        {LAB_BLUEPRINTS.map((lab) => {
          const telemetry = telemetryMap[lab.slug];
          const accent = OG_ACCENTS[lab.accentColor];
          return (
            <article
              key={lab.slug}
              style={{
                backgroundColor: '#0b0f19',
                border: '1px solid #1e2638',
                borderTop: `3px solid ${accent.hex}`,
                borderRadius: '14px',
                padding: '20px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                    fontSize: '12px',
                    color: accent.pillText,
                    backgroundColor: accent.softBg,
                    border: `1px solid ${accent.border}`,
                    borderRadius: '6px',
                    padding: '2px 8px',
                  }}
                >
                  {lab.code} · {lab.categoryLabel}
                </span>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                    fontSize: '11px',
                    color:
                      telemetry.provenance === 'VERIFIED_LIVE' ? '#34d399' : '#94a3b8',
                  }}
                >
                  {telemetry.sourceLabel}
                </span>
              </div>

              <h2
                style={{
                  margin: '12px 0 4px',
                  fontSize: '22px',
                  color: '#f8fafc',
                }}
              >
                {lab.title}
              </h2>
              <p
                style={{
                  margin: '0 0 14px',
                  fontSize: '13px',
                  color: '#94a3b8',
                }}
              >
                {lab.subtitle}
              </p>

              <div
                style={{
                  borderTop: '1px solid #171e2e',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {telemetry.headlineMetric.label}
                  </div>
                  <div
                    style={{
                      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                      fontSize: '26px',
                      fontWeight: 700,
                      color: accent.hex,
                    }}
                  >
                    {telemetry.headlineMetric.value}
                    {telemetry.headlineMetric.unit
                      ? ` ${telemetry.headlineMetric.unit}`
                      : ''}
                  </div>
                </div>

                <a
                  href={`/api/og/labs?engine=${lab.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                    fontSize: '12px',
                    color: accent.pillText,
                    textDecoration: 'none',
                  }}
                >
                  OG Card ↗
                </a>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
