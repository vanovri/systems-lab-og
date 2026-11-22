// src/app/labs/opengraph-image.tsx
import { ImageResponse } from 'next/og';
import { OG_ACCENTS, loadOgFonts } from './og-utils';
import { loadAllHydratedLabs } from './telemetry';
import {
  ALL_LAB_SLUGS,
  GITHUB_OWNER,
  HydratedLabTelemetry,
  LAB_BLUEPRINTS_BY_SLUG,
  LabSlug,
} from './types';

export const runtime = 'nodejs';
export const revalidate = 3600;
export const alt =
  'Systems Engineering Lab — 6-Engine Rust/WASM Multi-Zone Architecture';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function VerifiedCheckSvg({ color }: { color: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <path
        d="M3.2 8.4L6.4 11.6L12.8 4.8"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProbeRingSvg({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function EngineGridCard({
  slug,
  lab,
}: {
  slug: LabSlug;
  lab: HydratedLabTelemetry;
}) {
  const blueprint = LAB_BLUEPRINTS_BY_SLUG[slug];
  const palette = OG_ACCENTS[blueprint.accentColor];
  const isLive = lab.provenance === 'VERIFIED_LIVE';
  const m0 = lab.metrics[0];
  const m1 = lab.metrics[1];

  return (
    <div
      style={{
        width: 561,
        height: 150,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: 12,
        backgroundColor: isLive ? '#111927' : '#0c1322',
        border: isLive
          ? `1.5px solid ${palette.hex}`
          : '1px solid rgba(148, 163, 184, 0.22)',
      }}
    >
      {/* Row 1 (24px): Identity + Provenance Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              backgroundColor: palette.hex,
              display: 'flex',
            }}
          />
          <span
            style={{
              fontSize: 19,
              fontWeight: 700,
              color: '#f8fafc',
              letterSpacing: '-0.02em',
            }}
          >
            {blueprint.title}
          </span>
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: '#64748b',
            }}
          >
            {blueprint.code}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            borderRadius: 999,
            backgroundColor: isLive
              ? 'rgba(52, 211, 153, 0.15)'
              : 'rgba(148, 163, 184, 0.10)',
            border: isLive
              ? '1px solid rgba(52, 211, 153, 0.50)'
              : '1px solid rgba(148, 163, 184, 0.28)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            fontWeight: 700,
            color: isLive ? '#34d399' : '#94a3b8',
          }}
        >
          {isLive ? (
            <VerifiedCheckSvg color="#34d399" />
          ) : (
            <ProbeRingSvg color="#94a3b8" />
          )}
          <span>
            {isLive
              ? `VERIFIED LIVE · ${lab.commitSha.slice(0, 7)}`
              : 'STANDBY PROBE'}
          </span>
        </div>
      </div>

      {/* Row 2 (54px): Headline Metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 19,
            fontWeight: 700,
            color: palette.hex,
            lineHeight: 1.15,
          }}
        >
          {m0.value}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11.5,
            color: '#cbd5e1',
          }}
        >
          {`${m0.label} · ${m1.label}: ${m1.value}`}
        </span>
      </div>

      {/* Row 3 (20px): Footer Metadata */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: '#64748b',
        }}
      >
        <span>{`${lab.cratesCount} crates · ${lab.wasmSizeKb} KB WASM`}</span>
        <span>{`/labs/${blueprint.slug}`}</span>
      </div>
    </div>
  );
}

export default async function OpenGraphImage() {
  const [fonts, labsMap] = await Promise.all([
    loadOgFonts(),
    loadAllHydratedLabs(),
  ]);

  const rows: LabSlug[][] = [
    ALL_LAB_SLUGS.slice(0, 2),
    ALL_LAB_SLUGS.slice(2, 4),
    ALL_LAB_SLUGS.slice(4, 6),
  ];

  const liveCount = ALL_LAB_SLUGS.filter(
    (slug) => labsMap[slug].provenance === 'VERIFIED_LIVE'
  ).length;
  const probeCount = ALL_LAB_SLUGS.length - liveCount;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 32px',
          backgroundColor: '#070b12',
          backgroundImage:
            'radial-gradient(circle at 84% 88%, rgba(245, 158, 11, 0.13) 0%, rgba(7, 11, 18, 0) 42%)',
          color: '#f8fafc',
          fontFamily: 'Inter, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Header: 58px */}
        <div
          style={{
            height: 58,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span
              style={{
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
              }}
            >
              Systems Engineering Lab
            </span>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              {'6-Engine Rust + WebAssembly Multi-Zone Workbench · Explicit Live vs Probe Provenance'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 11px',
                borderRadius: 999,
                backgroundColor: 'rgba(52, 211, 153, 0.14)',
                border: '1px solid rgba(52, 211, 153, 0.45)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11.5,
                fontWeight: 700,
                color: '#34d399',
              }}
            >
              <VerifiedCheckSvg color="#34d399" />
              <span>{`${liveCount}/${ALL_LAB_SLUGS.length} VERIFIED LIVE`}</span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 11px',
                borderRadius: 999,
                backgroundColor: 'rgba(148, 163, 184, 0.10)',
                border: '1px solid rgba(148, 163, 184, 0.28)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11.5,
                fontWeight: 700,
                color: '#94a3b8',
              }}
            >
              <ProbeRingSvg color="#94a3b8" />
              <span>{`${probeCount}/${ALL_LAB_SLUGS.length} STANDBY PROBE`}</span>
            </div>
          </div>
        </div>

        {/* 3x2 Grid: 474px = (3 * 150) + (2 * 12) */}
        <div
          style={{
            height: 474,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {rows.map((pair, rowIdx) => (
            <div key={rowIdx} style={{ height: 150, display: 'flex', gap: 14 }}>
              {pair.map((slug) => (
                <EngineGridCard key={slug} slug={slug} lab={labsMap[slug]} />
              ))}
            </div>
          ))}
        </div>

        {/* Footer: 22px */}
        <div
          style={{
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            color: '#64748b',
          }}
        >
          <span>{`github.com/${GITHUB_OWNER} · COOP/COEP Isolated · WASM SIMD128`}</span>
          <span>{'ardhyanovri.my.id/labs'}</span>
        </div>
      </div>
    ),
    {
      ...size,
      ...(fonts.length > 0 ? { fonts } : {}),
    }
  );
}
