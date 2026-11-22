// tests/og-contract.test.ts
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import {
  OG_ACCENTS,
  loadOgFonts,
  loadOgFontsWithMeta,
  normalizeDiagramLine,
  resolveLabBlueprint,
} from '../src/app/labs/og-utils';
import {
  buildStandbyTelemetry,
  isValidVerifiedSummary,
  isValidWave0Summary,
  loadAllHydratedLabs,
  normalizeVerifiedSummary,
} from '../src/app/labs/telemetry';
import {
  ALL_LAB_SLUGS,
  FLAGSHIP_SLUG,
  GITHUB_OWNER,
  LAB_BLUEPRINTS,
  LAB_BLUEPRINTS_BY_SLUG,
  LabSlug,
} from '../src/app/labs/types';

test('OG_ACCENTS covers every accentColor, 6-engine order matches 01..06, and bento spans are 7-5 / 5-7 / 7-5', () => {
  assert.equal(LAB_BLUEPRINTS.length, 6);
  assert.equal(ALL_LAB_SLUGS.length, 6);
  assert.equal(FLAGSHIP_SLUG, 'dst-kv');
  assert.deepEqual(ALL_LAB_SLUGS, [
    'vectradb',
    'kronos',
    'aegis',
    'novaserve',
    'spectre',
    'dst-kv',
  ]);
  assert.deepEqual(
    LAB_BLUEPRINTS.map((bp) => bp.code),
    ['SYS-01', 'SYS-02', 'SYS-03', 'SYS-04', 'SYS-05', 'SYS-06']
  );
  assert.deepEqual(
    LAB_BLUEPRINTS.map((bp) => bp.bentoColSpan),
    [
      'lg:col-span-7',
      'lg:col-span-5',
      'lg:col-span-5',
      'lg:col-span-7',
      'lg:col-span-7',
      'lg:col-span-5',
    ]
  );

  for (const bp of LAB_BLUEPRINTS) {
    const palette = OG_ACCENTS[bp.accentColor];
    assert.ok(palette, `Missing palette for ${bp.accentColor}`);
    assert.match(palette.hex, /^#[0-9a-f]{6}$/i);
    assert.ok(palette.softBg.startsWith('rgba('));
    assert.ok(palette.border.startsWith('rgba('));
    assert.match(palette.pillText, /^#[0-9a-f]{6}$/i);
    assert.ok(
      bp.memoryLayoutDiagram.length >= 1 && bp.memoryLayoutDiagram.length <= 5,
      `${bp.slug} diagram lines=${bp.memoryLayoutDiagram.length} exceeds 5-line pixel budget`
    );
  }
});

test('GITHUB_OWNER defaults to vanovri when NEXT_PUBLIC_GITHUB_USER is unset', () => {
  if (!process.env.NEXT_PUBLIC_GITHUB_USER) {
    assert.equal(GITHUB_OWNER, 'vanovri');
  }
});

test('resolveLabBlueprint handles exact, uppercase, unknown, and nullish slugs', () => {
  assert.equal(resolveLabBlueprint('vectradb').slug, 'vectradb');
  assert.equal(resolveLabBlueprint('kronos').slug, 'kronos');
  assert.equal(resolveLabBlueprint('aegis').slug, 'aegis');
  assert.equal(resolveLabBlueprint('novaserve').slug, 'novaserve');
  assert.equal(resolveLabBlueprint('spectre').slug, 'spectre');
  assert.equal(resolveLabBlueprint('dst-kv').slug, 'dst-kv');

  assert.equal(resolveLabBlueprint('DST-KV').slug, 'dst-kv');
  assert.equal(resolveLabBlueprint('KRONOS').slug, 'kronos');
  assert.equal(resolveLabBlueprint('SPECTRE').slug, 'spectre');
  assert.equal(resolveLabBlueprint('  Aegis ').slug, 'aegis');
  assert.equal(resolveLabBlueprint('unknown-engine').slug, 'dst-kv');
  assert.equal(resolveLabBlueprint(null).slug, 'dst-kv');
  assert.equal(resolveLabBlueprint(undefined).slug, 'dst-kv');
});

test('isValidVerifiedSummary fails closed on PARTIAL_VERIFY, malformed, or path-traversal payloads and downgrades to STANDBY_PROBE', () => {
  const valid = {
    schemaVersion: '1.0.0',
    slug: 'dst-kv',
    status: 'VERIFIED_LIVE',
    commitSha: 'f169eec',
    verifiedAt: '2026-11-22T00:00:00Z',
    wasmAssetPath: '/labs/dst-kv/assets/dst_sim.wasm',
    wasmSizeKb: 546,
    cratesCount: 6,
    headlineMetrics: [
      { id: 'marathon_seeds', label: 'Wing-Gong Marathon', value: '10,000 seeds / 533,348 ops' },
      { id: 'sigkill_failover', label: '5-Node SIGKILL Failover', value: '822 ms (P99 22.71 ms)' },
      { id: 'nemesis_mttr', label: '7-Class Nemesis MTTR', value: '200 ms avg / 300 ms max' },
    ],
  };

  assert.equal(isValidWave0Summary(valid, 'dst-kv'), true);
  assert.equal(isValidVerifiedSummary(valid, 'dst-kv'), true);

  const partial = { ...valid, status: 'PARTIAL_VERIFY' };
  assert.equal(isValidWave0Summary(partial, 'dst-kv'), false);
  assert.equal(isValidVerifiedSummary(partial, 'dst-kv'), false);
  assert.equal(normalizeVerifiedSummary(partial, LAB_BLUEPRINTS_BY_SLUG['dst-kv']), null);

  const standby = buildStandbyTelemetry(LAB_BLUEPRINTS_BY_SLUG['dst-kv']);
  assert.equal(standby.provenance, 'STANDBY_PROBE');
  assert.equal(standby.sourceLabel, 'STANDBY PROBE');

  assert.equal(
    isValidVerifiedSummary({ ...valid, wasmAssetPath: '/labs/../etc/passwd' }, 'dst-kv'),
    false
  );
  assert.equal(
    isValidVerifiedSummary({ ...valid, headlineMetrics: valid.headlineMetrics.slice(0, 2) }, 'dst-kv'),
    false
  );
  assert.equal(isValidVerifiedSummary(valid, 'vectradb'), false);
});

test('loadAllHydratedLabs resolves 6/6 VERIFIED_LIVE (0/6 STANDBY_PROBE) from sibling summary.json artifacts', async () => {
  const prevDisable = process.env.OG_DISABLE_REMOTE_FETCH;
  process.env.OG_DISABLE_REMOTE_FETCH = '1';
  try {
    const labs = await loadAllHydratedLabs();
    assert.equal(labs['dst-kv'].provenance, 'VERIFIED_LIVE');
    assert.equal(labs['dst-kv'].commitSha.slice(0, 7), 'f169eec');
    assert.equal(labs['dst-kv'].wasmSizeKb, 546);

    assert.equal(labs.kronos.provenance, 'VERIFIED_LIVE');
    assert.equal(labs.kronos.commitSha.slice(0, 7), '077bd4e');
    assert.equal(labs.kronos.cratesCount, 12);
    assert.equal(labs.kronos.wasmSizeKb, 382);
    assert.equal(labs.kronos.metrics[0].value, '4,135,087 orders/s');
    assert.equal(labs.kronos.metrics[1].value, '206 ns / 616 ns');

    assert.equal(labs.novaserve.provenance, 'VERIFIED_LIVE');
    assert.equal(labs.novaserve.commitSha.slice(0, 7), '197061a');
    assert.equal(labs.novaserve.cratesCount, 10);
    assert.equal(labs.novaserve.wasmSizeKb, 1245);
    assert.equal(labs.novaserve.metrics[0].value, '11.17x (95.8% hit)');
    assert.equal(labs.novaserve.metrics[1].value, '4.27x drop (56.45 ms)');

    assert.equal(labs.aegis.provenance, 'VERIFIED_LIVE');
    assert.equal(labs.aegis.commitSha.slice(0, 7), 'cc0d0de');
    assert.equal(labs.aegis.cratesCount, 10);
    assert.equal(labs.aegis.wasmSizeKb, 327);
    assert.equal(labs.aegis.metrics[0].value, '0.009 ms p50 (867.09x)');
    assert.equal(labs.aegis.metrics[1].value, '97.77% (71.20 MiB)');

    assert.equal(labs.vectradb.provenance, 'VERIFIED_LIVE');
    assert.equal(labs.vectradb.commitSha.slice(0, 7), '5a1720d');
    assert.equal(labs.vectradb.cratesCount, 10);
    assert.equal(labs.vectradb.wasmSizeKb, 2035);
    assert.equal(labs.vectradb.metrics[0].value, '261.53 ms geomean (6.96x)');
    assert.equal(labs.vectradb.metrics[1].value, '25,000 seeds / 5,794 SLT');

    assert.equal(labs.spectre.provenance, 'VERIFIED_LIVE');
    assert.equal(labs.spectre.commitSha.slice(0, 7), 'd12f05b');
    assert.equal(labs.spectre.cratesCount, 10);
    assert.equal(labs.spectre.wasmSizeKb, 256);
    assert.equal(labs.spectre.metrics[0].value, '10.10 Mpps (99.00 ns/pkt)');
    assert.equal(labs.spectre.metrics[1].value, '1094.9k req/s (+48.99 us)');
    assert.equal(labs.spectre.metrics[2].value, '50,000/50,000 (0 drops)');

    const liveCount = ALL_LAB_SLUGS.filter((s) => labs[s].provenance === 'VERIFIED_LIVE').length;
    assert.equal(liveCount, 6);
  } finally {
    if (prevDisable === undefined) delete process.env.OG_DISABLE_REMOTE_FETCH;
    else process.env.OG_DISABLE_REMOTE_FETCH = prevDisable;
  }
});

test('normalizeDiagramLine preserves box-drawing when full mono glyphs exist and maps cleanly otherwise', () => {
  const sample = '┌────┬────┐ │ len │';
  assert.equal(normalizeDiagramLine(sample, true), sample);
  assert.equal(normalizeDiagramLine(sample, false), '+----+----+ | len |');
});

test('loadOgFonts({ preferLocal: true }) loads all 4 bundled fonts', async () => {
  const { fonts, hasBoxDrawingGlyphs } = await loadOgFontsWithMeta({
    preferLocal: true,
  });
  assert.equal(hasBoxDrawingGlyphs, true);
  assert.equal(fonts.length, 4);

  const signatures = fonts.map((f) => `${f.name}:${f.weight}`).sort();
  assert.deepEqual(signatures, [
    'Inter:600',
    'Inter:700',
    'JetBrains Mono:400',
    'JetBrains Mono:700',
  ]);

  for (const font of fonts) {
    assert.ok(font.data instanceof ArrayBuffer);
    assert.ok(font.data.byteLength > 20_000, `${font.name}:${font.weight} too small`);
  }
});

test('loadOgFonts resolves gracefully to [] on network timeout without throwing', async () => {
  const hangingFetcher: typeof fetch = () =>
    new Promise<Response>(() => {
      // Never resolves to simulate stalled CDN
    });

  const startedAt = Date.now();
  const fonts = await loadOgFonts({
    preferLocal: false,
    timeoutMs: 50,
    fetcher: hangingFetcher,
  });
  const elapsed = Date.now() - startedAt;

  assert.deepEqual(fonts, []);
  assert.ok(elapsed < 1000, `Expected fast timeout fallback, got ${elapsed}ms`);
});

test('studio meta snippets and vercel rewrites cover all 6 engines including dst-kv', async () => {
  const slugs: LabSlug[] = ['vectradb', 'kronos', 'aegis', 'novaserve', 'spectre', 'dst-kv'];
  for (const slug of slugs) {
    const filePath = path.join(
      process.cwd(),
      'integration',
      'studio-meta-snippets',
      `${slug}.head.html`
    );
    const html = await readFile(filePath, 'utf8');
    assert.ok(
      html.includes(`content="https://ardhyanovri.my.id/api/og/labs?engine=${slug}"`),
      `Missing absolute og:image URL for ${slug}`
    );
    assert.ok(
      html.includes(`content="https://ardhyanovri.my.id/labs/${slug}"`),
      `Missing og:url for ${slug}`
    );
    assert.ok(html.includes('content="1200"'), `Missing width 1200 for ${slug}`);
    assert.ok(html.includes('content="630"'), `Missing height 630 for ${slug}`);
    assert.ok(
      html.includes('content="summary_large_image"'),
      `Missing twitter:card summary_large_image for ${slug}`
    );
  }

  const rewritesPath = path.join(
    process.cwd(),
    'integration',
    'vercel-multizone-rewrites.json'
  );
  const rewritesConfig = JSON.parse(await readFile(rewritesPath, 'utf8')) as {
    rewrites: Array<{ source: string; destination: string }>;
  };
  for (const slug of slugs) {
    assert.ok(
      rewritesConfig.rewrites.some((r) => r.source === `/labs/${slug}`),
      `Missing rewrite for /labs/${slug}`
    );
    assert.ok(
      rewritesConfig.rewrites.some((r) => r.source === `/labs/${slug}/:path*`),
      `Missing wildcard rewrite for /labs/${slug}/:path*`
    );
  }
});
