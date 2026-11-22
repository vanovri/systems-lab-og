// scripts/sync-to-workbench.mjs
import { copyFile, mkdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_ROOT = path.resolve(__dirname, '..');
const DEFAULT_TARGET =
  'C:\\Users\\ardhy\\.gemini\\antigravity\\scratch\\systems-lab-workbench';

const FILES_TO_SYNC = [
  'src/app/labs/og-utils.ts',
  'src/app/labs/opengraph-image.tsx',
  'src/app/labs/twitter-image.tsx',
  'src/app/api/og/labs/route.tsx',
  'src/app/labs/fonts/inter-latin-600-normal.woff',
  'src/app/labs/fonts/inter-latin-700-normal.woff',
  'src/app/labs/fonts/JetBrainsMono-Bold.ttf',
  'src/app/labs/fonts/JetBrainsMono-Regular.ttf',
];

function parseArgs(argv) {
  let targetRoot = DEFAULT_TARGET;
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--target' && argv[i + 1]) {
      targetRoot = path.resolve(argv[i + 1]);
      i += 1;
    }
  }
  return { targetRoot, dryRun };
}

async function main() {
  const { targetRoot, dryRun } = parseArgs(process.argv.slice(2));

  console.log(
    `[sync-to-workbench] source=${SOURCE_ROOT} target=${targetRoot} dryRun=${dryRun}`
  );

  try {
    const info = await stat(targetRoot);
    if (!info.isDirectory()) {
      throw new Error(`Target is not a directory: ${targetRoot}`);
    }
  } catch (err) {
    console.error(
      `[sync-to-workbench] Target directory not found (${targetRoot}). Create or build systems-lab-workbench first, then re-run.`
    );
    process.exitCode = 1;
    return;
  }

  for (const rel of FILES_TO_SYNC) {
    const src = path.join(SOURCE_ROOT, rel);
    const dst = path.join(targetRoot, rel);
    if (dryRun) {
      console.log(`[dry-run] copy ${src} -> ${dst}`);
    } else {
      await mkdir(path.dirname(dst), { recursive: true });
      await copyFile(src, dst);
      console.log(`[copied] ${rel}`);
    }
  }

  const targetLayout = path.join(targetRoot, 'src/app/layout.tsx');
  try {
    const layoutText = await readFile(targetLayout, 'utf8');
    if (layoutText.includes('metadataBase')) {
      console.log('[check] Target src/app/layout.tsx already declares metadataBase.');
    } else {
      console.warn(
        '[warn] Target src/app/layout.tsx is missing metadataBase! Add `metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ardhyanovri.my.id")` for LinkedInBot compliance.'
      );
    }
  } catch {
    console.warn(`[warn] Could not read ${targetLayout} to verify metadataBase.`);
  }

  console.log(
    '[sync-to-workbench] Note: Part 1 files (types.ts, telemetry.ts, LabsWorkbenchClient.tsx, page.tsx) were preserved untouched.'
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
