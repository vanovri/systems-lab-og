// src/app/labs/telemetry.ts
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  ALL_LAB_SLUGS,
  HydratedLabTelemetry,
  LAB_BLUEPRINTS_BY_SLUG,
  LabBlueprint,
  LabSlug,
  LabTelemetrySummary,
  SITE_URL,
  SimpleTelemetryMetric,
  TelemetryMetric,
  Wave0TelemetrySummary,
} from './types';

const WASM_ASSET_PATH_RE = /^\/labs\/[a-z0-9_-]+\/[a-zA-Z0-9._/-]+\.wasm$/;

const STANDBY_PROVENANCE_NOTE =
  'Running wasm32-simd128 standby probe · Full engine benchmarks pending';
const VERIFIED_PROVENANCE_NOTE =
  'Verified against repository summary.json telemetry artifact';

const DEFAULT_LOCAL_SUMMARY_PATHS: Record<LabSlug, string> = {
  vectradb:
    process.env.VECTRADB_SUMMARY_PATH?.trim() ||
    path.resolve(process.cwd(), '../vectradb/studio/public/telemetry/summary.json'),
  kronos:
    process.env.KRONOS_SUMMARY_PATH?.trim() ||
    path.resolve(process.cwd(), '../kronos-lob/studio/public/telemetry/summary.json'),
  aegis:
    process.env.AEGIS_SUMMARY_PATH?.trim() ||
    path.resolve(process.cwd(), '../aegis-box/studio/public/telemetry/summary.json'),
  novaserve:
    process.env.NOVASERVE_SUMMARY_PATH?.trim() ||
    path.resolve(process.cwd(), '../novaserve/studio/public/telemetry/summary.json'),
  spectre:
    process.env.SPECTRE_SUMMARY_PATH?.trim() ||
    path.resolve(process.cwd(), '../spectre-mesh/studio/public/telemetry/summary.json'),
  'dst-kv':
    process.env.DST_KV_SUMMARY_PATH?.trim() ||
    path.resolve(process.cwd(), '../dst-kv/visualizer/public/telemetry/summary.json'),
};

export interface LoadTelemetryOptions {
  originOverride?: string;
  skipLocal?: boolean;
}

export function getSiteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return SITE_URL;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function isValidWasmPath(v: unknown): v is string {
  return typeof v === 'string' && !v.includes('..') && WASM_ASSET_PATH_RE.test(v);
}

function isValidSimpleMetric(m: unknown): m is SimpleTelemetryMetric {
  if (!m || typeof m !== 'object') return false;
  const rec = m as Record<string, unknown>;
  return (
    isNonEmptyString(rec.id) &&
    isNonEmptyString(rec.label) &&
    isNonEmptyString(rec.value)
  );
}

function isValidTelemetryMetric(m: unknown): m is TelemetryMetric {
  if (!m || typeof m !== 'object') return false;
  const rec = m as Partial<TelemetryMetric>;
  return (
    isNonEmptyString(rec.label) &&
    isNonEmptyString(rec.value) &&
    isNonEmptyString(rec.deltaOrNote) &&
    (rec.unit === undefined || typeof rec.unit === 'string')
  );
}

export function isValidWave0Summary(
  data: unknown,
  expectedSlug: LabSlug
): data is Wave0TelemetrySummary {
  if (!data || typeof data !== 'object') return false;
  const rec = data as Record<string, unknown>;

  if (rec.slug !== expectedSlug) return false;
  if (rec.status !== 'VERIFIED_LIVE') return false;
  if (!isNonEmptyString(rec.commitSha)) return false;
  if (!isNonEmptyString(rec.verifiedAt)) return false;
  if (!isValidWasmPath(rec.wasmAssetPath)) return false;
  if (
    typeof rec.wasmSizeKb !== 'number' ||
    !Number.isFinite(rec.wasmSizeKb) ||
    rec.wasmSizeKb <= 0
  ) {
    return false;
  }
  if (
    typeof rec.cratesCount !== 'number' ||
    !Number.isFinite(rec.cratesCount) ||
    rec.cratesCount <= 0
  ) {
    return false;
  }
  if (!Array.isArray(rec.headlineMetrics) || rec.headlineMetrics.length !== 3) {
    return false;
  }

  return rec.headlineMetrics.every(isValidSimpleMetric);
}

export function isValidV1Summary(
  data: unknown,
  expectedSlug: LabSlug
): data is LabTelemetrySummary {
  if (!data || typeof data !== 'object') return false;
  const rec = data as Partial<LabTelemetrySummary> & { status?: unknown };

  if (rec.schemaVersion !== 1 || rec.slug !== expectedSlug) return false;
  if (rec.status !== undefined && rec.status !== 'VERIFIED_LIVE') return false;
  if (
    typeof rec.wasmSizeKb !== 'number' ||
    !Number.isFinite(rec.wasmSizeKb) ||
    rec.wasmSizeKb <= 0
  ) {
    return false;
  }
  if (!isNonEmptyString(rec.commitSha)) return false;
  if (!isNonEmptyString(rec.generatedAtIso)) return false;
  if (!isNonEmptyString(rec.verificationGate)) return false;
  if (rec.wasmAssetPath !== undefined && !isValidWasmPath(rec.wasmAssetPath)) {
    return false;
  }
  if (!isValidTelemetryMetric(rec.headlineMetric)) return false;
  if (!Array.isArray(rec.secondaryMetrics) || rec.secondaryMetrics.length !== 3) {
    return false;
  }
  return rec.secondaryMetrics.every(isValidTelemetryMetric);
}

export function isValidVerifiedSummary(
  data: unknown,
  expectedSlug: LabSlug
): data is Wave0TelemetrySummary | LabTelemetrySummary {
  return (
    isValidWave0Summary(data, expectedSlug) ||
    isValidV1Summary(data, expectedSlug)
  );
}

export const isValidSummary = isValidVerifiedSummary;

function formatHeadlineValue(m: { value: string; unit?: string }): string {
  const val = m.value.trim();
  const unit = m.unit?.trim();
  if (!unit || val.toLowerCase().endsWith(unit.toLowerCase())) {
    return val;
  }
  return `${val} ${unit}`;
}

export function normalizeVerifiedSummary(
  raw: unknown,
  blueprint: LabBlueprint
): HydratedLabTelemetry | null {
  if (isValidWave0Summary(raw, blueprint.slug)) {
    const [m0, m1, m2] = raw.headlineMetrics;
    const shortSha = raw.commitSha.slice(0, 7);
    const sizeKb = Math.round(raw.wasmSizeKb);
    return {
      schemaVersion: 1,
      slug: blueprint.slug,
      status: 'VERIFIED_LIVE',
      commitSha: raw.commitSha,
      generatedAtIso: raw.verifiedAt,
      wasmSizeKb: sizeKb,
      wasmAssetPath: raw.wasmAssetPath,
      verificationGate: `VERIFIED LIVE · ${shortSha}`,
      headlineMetric: {
        label: m0.label,
        value: m0.value,
        deltaOrNote: `${raw.cratesCount} crates · ${sizeKb} KB real WASM`,
      },
      secondaryMetrics: [
        { label: m1.label, value: m1.value, deltaOrNote: 'Live verified' },
        { label: m2.label, value: m2.value, deltaOrNote: 'Live verified' },
        {
          label: 'WASM Debugger',
          value: `${sizeKb} KB`,
          deltaOrNote: 'Real Rust wasm32 ABI',
        },
      ],
      source: 'LIVE_EDGE',
      provenance: 'VERIFIED_LIVE',
      provenanceNote: VERIFIED_PROVENANCE_NOTE,
      sourceLabel: `VERIFIED LIVE · ${shortSha}`,
      verifiedAt: raw.verifiedAt,
      cratesCount: raw.cratesCount,
      metrics: [m0, m1, m2],
    };
  }

  if (isValidV1Summary(raw, blueprint.slug)) {
    const [s0, s1] = raw.secondaryMetrics;
    const shortSha = raw.commitSha.slice(0, 7);
    const metrics: [SimpleTelemetryMetric, SimpleTelemetryMetric, SimpleTelemetryMetric] = [
      {
        id: 'headline',
        label: raw.headlineMetric.label,
        value: formatHeadlineValue(raw.headlineMetric),
      },
      {
        id: 'secondary_0',
        label: s0.label,
        value: formatHeadlineValue(s0),
      },
      {
        id: 'secondary_1',
        label: s1.label,
        value: formatHeadlineValue(s1),
      },
    ];
    return {
      ...raw,
      status: 'VERIFIED_LIVE',
      wasmSizeKb: Math.round(raw.wasmSizeKb),
      source: 'LIVE_EDGE',
      provenance: 'VERIFIED_LIVE',
      provenanceNote: VERIFIED_PROVENANCE_NOTE,
      sourceLabel: `VERIFIED LIVE · ${shortSha}`,
      verifiedAt: raw.generatedAtIso,
      cratesCount: blueprint.cratesCount,
      metrics,
    };
  }

  return null;
}

export function buildStandbyTelemetry(blueprint: LabBlueprint): HydratedLabTelemetry {
  const fb = blueprint.fallbackTelemetry;
  const [s0, s1] = fb.secondaryMetrics;
  return {
    ...fb,
    source: 'STANDBY_PROBE',
    provenance: 'STANDBY_PROBE',
    provenanceNote: STANDBY_PROVENANCE_NOTE,
    sourceLabel: 'STANDBY PROBE',
    verifiedAt: null,
    cratesCount: blueprint.cratesCount,
    metrics: [
      {
        id: 'headline',
        label: fb.headlineMetric.label,
        value: formatHeadlineValue(fb.headlineMetric),
      },
      {
        id: 'secondary_0',
        label: s0.label,
        value: formatHeadlineValue(s0),
      },
      {
        id: 'secondary_1',
        label: s1.label,
        value: formatHeadlineValue(s1),
      },
    ],
  };
}

async function readLocalSummary(slug: LabSlug): Promise<unknown | null> {
  const filePath = DEFAULT_LOCAL_SUMMARY_PATHS[slug];
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

async function fetchRemoteSummary(
  slug: LabSlug,
  origin: string,
  allowOverride = false
): Promise<unknown | null> {
  if (!allowOverride && process.env.OG_DISABLE_REMOTE_FETCH === '1') return null;
  const endpoint = `${origin}/labs/${slug}/telemetry/summary.json`;
  try {
    const res = await fetch(endpoint, {
      next: { revalidate: 3600, tags: [`lab-telemetry-${slug}`] },
      signal: AbortSignal.timeout(2500),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

export async function loadHydratedLab(
  slug: LabSlug,
  options: LoadTelemetryOptions = {}
): Promise<HydratedLabTelemetry> {
  const blueprint = LAB_BLUEPRINTS_BY_SLUG[slug];

  if (!options.skipLocal) {
    const localRaw = await readLocalSummary(slug);
    const localNormalized = normalizeVerifiedSummary(localRaw, blueprint);
    if (localNormalized) {
      return localNormalized;
    }
  }

  const origin = options.originOverride ?? getSiteOrigin();
  const remoteRaw = await fetchRemoteSummary(
    slug,
    origin,
    Boolean(options.originOverride)
  );
  const remoteNormalized = normalizeVerifiedSummary(remoteRaw, blueprint);
  if (remoteNormalized) {
    return remoteNormalized;
  }

  return buildStandbyTelemetry(blueprint);
}

export async function loadAllHydratedLabs(
  originOverride?: string,
  options: Omit<LoadTelemetryOptions, 'originOverride'> = {}
): Promise<Record<LabSlug, HydratedLabTelemetry>> {
  const entries = await Promise.all(
    ALL_LAB_SLUGS.map(
      async (slug) =>
        [slug, await loadHydratedLab(slug, { ...options, originOverride })] as const
    )
  );
  return Object.fromEntries(entries) as Record<LabSlug, HydratedLabTelemetry>;
}

export const fetchAllLabsTelemetry = loadAllHydratedLabs;
