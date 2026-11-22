// src/app/api/og/labs/route.tsx
import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';
import {
  OG_ACCENTS,
  loadOgFontsWithMeta,
  normalizeDiagramLine,
  resolveLabBlueprint,
} from '../../../labs/og-utils';
import { loadHydratedLab } from '../../../labs/telemetry';
import { GITHUB_OWNER } from '../../../labs/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function VerifiedCheckSvg({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
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
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export async function GET(req: NextRequest) {
  const blueprint = resolveLabBlueprint(req.nextUrl.searchParams.get('engine'));
  const [{ fonts, hasBoxDrawingGlyphs }, lab] = await Promise.all([
    loadOgFontsWithMeta(),
    loadHydratedLab(blueprint.slug),
  ]);

  const accent = OG_ACCENTS[blueprint.accentColor];
  const isLive = lab.provenance === 'VERIFIED_LIVE';

  const diagramLines = blueprint.memoryLayoutDiagram
    .slice(0, 5)
    .map((line) => normalizeDiagramLine(line, hasBoxDrawingGlyphs));

  const maxDiagramChars = Math.max(0, ...diagramLines.map((l) => l.length));
  const diagramFontSize =
    maxDiagramChars > 78 ? 10 : maxDiagramChars > 66 ? 11.5 : maxDiagramChars > 52 ? 12.5 : 13.5;

  const statusColor = isLive ? '#34d399' : '#94a3b8';
  const statusBg = isLive
    ? 'rgba(52, 211, 153, 0.14)'
    : 'rgba(148, 163, 184, 0.12)';
  const statusBorder = isLive
    ? 'rgba(52, 211, 153, 0.45)'
    : 'rgba(148, 163, 184, 0.30)';
  const statusText = isLive
    ? `VERIFIED LIVE · ${lab.commitSha.slice(0, 7)}`
    : 'STANDBY PROBE · SPEC TARGET';

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '30px 38px',
          backgroundColor: '#070b12',
          backgroundImage: `radial-gradient(circle at 86% 12%, ${accent.softBg} 0%, rgba(7, 11, 18, 0) 48%)`,
          color: '#f8fafc',
          fontFamily: 'Inter, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Row 1: Breadcrumb + Provenance Badge (34px) */}
        <div
          style={{
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 14,
              color: '#94a3b8',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: accent.hex,
                display: 'flex',
              }}
            />
            <span>{`${blueprint.code} · ardhyanovri.my.id / labs / ${blueprint.slug}`}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              backgroundColor: statusBg,
              border: `1px solid ${statusBorder}`,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              fontWeight: 700,
              color: statusColor,
            }}
          >
            {isLive ? (
              <VerifiedCheckSvg color={statusColor} />
            ) : (
              <ProbeRingSvg color={statusColor} />
            )}
            <span>{statusText}</span>
          </div>
        </div>

        {/* Row 2: Engine Hero Header (82px) */}
        <div
          style={{
            height: 82,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span
              style={{
                fontSize: 40,
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#f8fafc',
                lineHeight: 1.05,
              }}
            >
              {blueprint.title}
            </span>
            <div
              style={{
                display: 'flex',
                padding: '4px 12px',
                borderRadius: 6,
                backgroundColor: accent.softBg,
                border: `1px solid ${accent.hex}`,
                color: accent.hex,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {blueprint.categoryLabel}
            </div>
          </div>

          <span style={{ fontSize: 17, color: '#cbd5e1', lineHeight: 1.3 }}>
            {blueprint.subtitle}
          </span>
        </div>

        {/* Row 3: 2-Column Core Body (368px) */}
        <div style={{ height: 368, display: 'flex', gap: 20 }}>
          {/* Left: 3 Stacked Metric Cards (468px) */}
          <div
            style={{
              width: 468,
              height: 368,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {lab.metrics.map((metric, idx) => (
              <div
                key={metric.id}
                style={{
                  height: 114,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '14px 18px',
                  borderRadius: 12,
                  backgroundColor: '#0f172a',
                  border:
                    idx === 0
                      ? `1px solid ${accent.hex}`
                      : '1px solid rgba(148, 163, 184, 0.22)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    color: '#94a3b8',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {metric.label}
                </span>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 22,
                    fontWeight: 700,
                    color: idx === 0 ? accent.hex : '#f8fafc',
                    lineHeight: 1.15,
                  }}
                >
                  {metric.value}
                </span>
              </div>
            ))}
          </div>

          {/* Right: 5-Line Architecture Diagram + Runtime Proof Box (636px) */}
          <div
            style={{
              width: 636,
              height: 368,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '18px 22px',
              borderRadius: 12,
              backgroundColor: '#0b1220',
              border: '1px solid rgba(148, 163, 184, 0.24)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    fontWeight: 700,
                    color: accent.hex,
                    letterSpacing: '0.05em',
                  }}
                >
                  {blueprint.memoryLayoutTitle}
                </span>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    color: '#64748b',
                  }}
                >
                  {`RUST · ${lab.cratesCount} CRATES`}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '14px 16px',
                  borderRadius: 8,
                  backgroundColor: '#05080f',
                  border: '1px solid rgba(51, 65, 85, 0.75)',
                }}
              >
                {diagramLines.map((line, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: diagramFontSize,
                      lineHeight: 1.55,
                      color: '#e2e8f0',
                      whiteSpace: 'pre',
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Proof Strip */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                paddingTop: 12,
                borderTop: '1px solid rgba(148, 163, 184, 0.18)',
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                {blueprint.runtimeBadges.map((badge) => (
                  <div
                    key={badge}
                    style={{
                      display: 'flex',
                      padding: '4px 10px',
                      borderRadius: 6,
                      backgroundColor: 'rgba(30, 41, 59, 0.9)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                      color: '#cbd5e1',
                    }}
                  >
                    {badge}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  color: '#94a3b8',
                }}
              >
                <span>{`WASM Artifact: ${lab.wasmSizeKb} KB (${isLive ? 'Real Engine WASM' : 'Standby Probe'})`}</span>
                <span>{`Wave: ${blueprint.releaseWave.toUpperCase()}`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4: Footer (26px) */}
        <div
          style={{
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            color: '#64748b',
          }}
        >
          <span>{`github.com/${GITHUB_OWNER}/${blueprint.repoName}`}</span>
          <span>{'Ardhya Novri Ramadhan · Systems Engineering Lab'}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      ...(fonts.length > 0 ? { fonts } : {}),
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
