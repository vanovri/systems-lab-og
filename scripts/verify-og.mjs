// scripts/verify-og.mjs
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(PROJECT_ROOT, 'artifacts', 'og-previews');

const PORT = 3099;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function killTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
    });
  } else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        // already exited
      }
    }
  }
}

async function waitForServer(timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'no attempt';
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/labs`, {
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) return;
      lastError = `HTTP ${res.status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(
    `Next.js production server did not become ready on ${BASE_URL} (last: ${lastError})`
  );
}

function assertValidPng(buf, label) {
  assert.ok(buf.byteLength > 15_000, `${label}: PNG too small (${buf.byteLength} bytes)`);
  assert.ok(
    buf.subarray(0, 8).equals(PNG_SIGNATURE),
    `${label}: invalid PNG signature`
  );
  assert.equal(
    buf.subarray(12, 16).toString('ascii'),
    'IHDR',
    `${label}: missing IHDR chunk`
  );
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  assert.equal(width, 1200, `${label}: expected width 1200, got ${width}`);
  assert.equal(height, 630, `${label}: expected height 630, got ${height}`);
  return { width, height, bytes: buf.byteLength };
}

async function main() {
  const nextBin = path.join(PROJECT_ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
  const child = spawn(
    process.execPath,
    [nextBin, 'start', '-H', '127.0.0.1', '-p', String(PORT)],
    {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        OG_DISABLE_REMOTE_FETCH: '1',
        NEXT_PUBLIC_SITE_URL: 'https://ardhyanovri.my.id',
        NEXT_PUBLIC_GITHUB_USER: 'vanovri',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    }
  );

  let stdoutLog = '';
  let stderrLog = '';
  child.stdout.on('data', (chunk) => {
    stdoutLog += chunk.toString('utf8');
  });
  child.stderr.on('data', (chunk) => {
    stderrLog += chunk.toString('utf8');
  });

  try {
    await waitForServer();

    // 1. Verify /labs HTML contains absolute og:image & twitter:image via metadataBase
    const labsHtmlRes = await fetch(`${BASE_URL}/labs`);
    assert.equal(labsHtmlRes.status, 200, '/labs must return HTTP 200');
    const labsHtml = await labsHtmlRes.text();
    assert.ok(
      labsHtml.includes('property="og:image" content="https://ardhyanovri.my.id/labs/opengraph-image'),
      'Missing absolute og:image URL from metadataBase in /labs HTML'
    );
    assert.ok(
      labsHtml.includes('name="twitter:image" content="https://ardhyanovri.my.id/labs/twitter-image'),
      'Missing absolute twitter:image URL from metadataBase in /labs HTML'
    );
    console.log('[PASS] /labs HTML absolute metadataBase og:image & twitter:image tags verified');

    // 2. Verify all 9 OG image routes (index, twitter, 6 engines SYS-01..SYS-06, invalid fallback)
    const endpoints = [
      { route: '/labs/opengraph-image', saveAs: 'labs-index.png' },
      { route: '/labs/twitter-image', saveAs: null },
      { route: '/api/og/labs?engine=vectradb', saveAs: 'labs-vectradb.png' },
      {
        route: '/api/og/labs?engine=kronos',
        saveAs: 'labs-kronos.png',
        checkCacheControl: true,
      },
      { route: '/api/og/labs?engine=aegis', saveAs: 'labs-aegis.png' },
      { route: '/api/og/labs?engine=novaserve', saveAs: 'labs-novaserve.png' },
      { route: '/api/og/labs?engine=spectre', saveAs: 'labs-spectre.png' },
      { route: '/api/og/labs?engine=dst-kv', saveAs: 'labs-dst-kv.png' },
      { route: '/api/og/labs?engine=invalid-fallback', saveAs: null },
    ];

    await mkdir(OUT_DIR, { recursive: true });

    for (const item of endpoints) {
      const res = await fetch(`${BASE_URL}${item.route}`, {
        signal: AbortSignal.timeout(15000),
      });
      assert.equal(res.status, 200, `${item.route} returned ${res.status}`);
      const contentType = res.headers.get('content-type') ?? '';
      assert.ok(
        contentType.includes('image/png'),
        `${item.route} invalid content-type: ${contentType}`
      );

      if (item.checkCacheControl) {
        const cacheControl = res.headers.get('cache-control') ?? '';
        assert.ok(
          cacheControl.includes('s-maxage=3600') &&
            cacheControl.includes('stale-while-revalidate=86400'),
          `${item.route} unexpected Cache-Control: ${cacheControl}`
        );
      }

      const buf = Buffer.from(await res.arrayBuffer());
      const meta = assertValidPng(buf, item.route);

      if (item.saveAs) {
        const artifactPath = path.join(OUT_DIR, item.saveAs);
        await writeFile(artifactPath, buf);
      }

      console.log(
        `[PASS] ${item.route} -> 200 image/png ${meta.width}x${meta.height} (${meta.bytes} B)`
      );
    }

    console.log(`[ALL PASS] ${endpoints.length}/${endpoints.length} OG verification checks succeeded.`);
  } catch (err) {
    if (stdoutLog.trim()) {
      console.error('[server stdout]\n' + stdoutLog.trim());
    }
    if (stderrLog.trim()) {
      console.error('[server stderr]\n' + stderrLog.trim());
    }
    throw err;
  } finally {
    killTree(child.pid);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
