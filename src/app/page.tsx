// src/app/page.tsx
import { OG_ACCENTS } from './labs/og-utils';
import { LAB_BLUEPRINTS } from './labs/types';

export default function OgInspectorHomePage() {
  return (
    <main
      style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '40px 24px 80px',
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
          <span
            style={{
              display: 'inline-block',
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: '12px',
              color: '#60a5fa',
              backgroundColor: 'rgba(37, 99, 235, 0.14)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '999px',
              padding: '4px 12px',
            }}
          >
            SATORI NEXT/OG · LINKEDIN POST INSPECTOR WORKBENCH
          </span>
          <h1
            style={{
              margin: '12px 0 6px',
              fontSize: '34px',
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}
          >
            Multi-Zone Open Graph Generator
          </h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '15px' }}>
            Live 1200×630 previews for <code style={{ color: '#e2e8f0' }}>/labs</code>{' '}
            index bento matrix and per-engine deep-dive cards.
          </p>
        </div>

        <a
          href="/labs"
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #1e293b',
            backgroundColor: '#0b0f19',
            color: '#e2e8f0',
            textDecoration: 'none',
            fontSize: '13px',
          }}
        >
          Open /labs Route →
        </a>
      </header>

      {/* Layer 1: /labs Index Bento Card */}
      <section style={{ marginTop: '32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', color: '#f8fafc' }}>
            Layer 1 · /labs Index Bento Card (1200×630)
          </h2>
          <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
            <a
              href="/labs/opengraph-image"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#60a5fa' }}
            >
              /labs/opengraph-image
            </a>
            <a
              href="/labs/twitter-image"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#94a3b8' }}
            >
              /labs/twitter-image
            </a>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#0b0f19',
            border: '1px solid #1e2638',
            borderRadius: '14px',
            overflow: 'hidden',
            maxWidth: '920px',
          }}
        >
          <img
            src="/labs/opengraph-image"
            alt="Systems Engineering Lab 6-Engine 3x2 Open Graph Card"
            width={1200}
            height={630}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          <div
            style={{
              padding: '14px 18px',
              borderTop: '1px solid #1e2638',
              backgroundColor: '#090d16',
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
              Systems Engineering Lab — 6-Engine Rust/WASM Architecture (VectraDB, KronosLOB, AegisBox, NovaServe, SpectreMesh &amp; DST-KV)
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              ardhyanovri.my.id/labs · LinkedIn summary_large_image preview
            </div>
          </div>
        </div>
      </section>

      {/* Layer 2: Per-Engine Studio Cards */}
      <section style={{ marginTop: '44px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '20px', color: '#f8fafc' }}>
          Layer 2 · Dynamic Engine Route Handler (/api/og/labs?engine=&lt;slug&gt;)
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(520px, 1fr))',
            gap: '22px',
          }}
        >
          {LAB_BLUEPRINTS.map((lab) => {
            const accent = OG_ACCENTS[lab.accentColor];
            const endpoint = `/api/og/labs?engine=${lab.slug}`;
            return (
              <article
                key={lab.slug}
                style={{
                  backgroundColor: '#0b0f19',
                  border: '1px solid #1e2638',
                  borderTop: `3px solid ${accent.hex}`,
                  borderRadius: '14px',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={endpoint}
                  alt={`${lab.title} Open Graph Preview`}
                  width={1200}
                  height={630}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
                <div
                  style={{
                    padding: '14px 18px',
                    borderTop: '1px solid #1e2638',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#f8fafc',
                      }}
                    >
                      {lab.title} · {lab.categoryLabel}
                    </div>
                    <div
                      style={{
                        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                        fontSize: '12px',
                        color: '#94a3b8',
                        marginTop: '3px',
                      }}
                    >
                      ardhyanovri.my.id/labs/{lab.slug}
                    </div>
                  </div>

                  <a
                    href={endpoint}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                      fontSize: '12px',
                      color: accent.pillText,
                      backgroundColor: accent.softBg,
                      border: `1px solid ${accent.border}`,
                      borderRadius: '6px',
                      padding: '6px 10px',
                      textDecoration: 'none',
                    }}
                  >
                    {endpoint} ↗
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
