// scripts/export-static-og.mjs
import { spawn, spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(PROJECT_ROOT, 'artifacts', 'og-previews');

const TARGETS = [
  { route: '/labs/opengraph-image', filename: 'labs-index.png' },
  { route: '/labs/opengraph-image', filename: 'labs.png' },
  { route: '/api/og/labs?engine=vectradb', filename: 'labs-vectradb.png' },
  { route: '/api/og/labs?engine=kronos', filename: 'labs-kronos.png' },
  { route: '/api/og/labs?engine=aegis', filename: 'labs-aegis.png' },
  { route: '/api/og/labs?engine=novaserve', filename: 'labs-novaserve.png' },
  { route: '/api/og/labs?engine=spectre', filename: 'labs-spectre.png' },
  { route: '/api/og/labs?engine=dst-kv', filename: 'labs-dst-kv.png' },
];

function parseBaseUrl(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--url' && argv[i + 1]) {
      return argv[i + 1].replace(/\/$/, '');
    }
  }
  return null;
}

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

async function waitForServer(baseUrl, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/labs`, {
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`Timed out waiting for Next.js server at ${baseUrl}`);
}

async function main() {
  const explicitUrl = parseBaseUrl(process.argv.slice(2));
  let baseUrl = explicitUrl;
  let child = null;

  if (!baseUrl) {
    const port = 3098;
    baseUrl = `http://127.0.0.1:${port}`;
    const nextBin = path.join(PROJECT_ROOT, 'node_modules', 'next', 'dist', 'bin', 'next');
    child = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(port)], {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        OG_DISABLE_REMOTE_FETCH: '1',
        NEXT_PUBLIC_SITE_URL: 'https://ardhyanovri.my.id',
        NEXT_PUBLIC_GITHUB_USER: 'vanovri',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: process.platform !== 'win32',
    });
    await waitForServer(baseUrl);
  }

  try {
    await mkdir(OUT_DIR, { recursive: true });
    for (const item of TARGETS) {
      const res = await fetch(`${baseUrl}${item.route}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        throw new Error(`Failed ${item.route}: HTTP ${res.status}`);
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const outPath = path.join(OUT_DIR, item.filename);
      await writeFile(outPath, buf);
      console.log(`[exported] ${item.filename} (${buf.byteLength} bytes)`);
    }
  } finally {
    if (child?.pid) {
      killTree(child.pid);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
