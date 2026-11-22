// src/app/labs/og-utils.ts
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  LAB_BLUEPRINTS,
  LAB_BLUEPRINTS_BY_SLUG,
  LabAccent,
  LabBlueprint,
  resolveLabSlug,
} from './types';

export interface SatoriFontConfig {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600 | 700;
  style: 'normal';
}

export interface OgAccentPalette {
  hex: string;
  softBg: string;
  border: string;
  pillText: string;
}

export interface LoadOgFontsOptions {
  preferLocal?: boolean;
  timeoutMs?: number;
  fetcher?: typeof fetch;
}

export interface LoadedOgFonts {
  fonts: SatoriFontConfig[];
  hasBoxDrawingGlyphs: boolean;
}

export const OG_ACCENTS: Record<LabAccent, OgAccentPalette> = {
  sky: {
    hex: '#38bdf8',
    softBg: 'rgba(56, 189, 248, 0.14)',
    border: 'rgba(56, 189, 248, 0.45)',
    pillText: '#7dd3fc',
  },
  emerald: {
    hex: '#34d399',
    softBg: 'rgba(52, 211, 153, 0.14)',
    border: 'rgba(52, 211, 153, 0.45)',
    pillText: '#6ee7b7',
  },
  violet: {
    hex: '#a78bfa',
    softBg: 'rgba(167, 139, 250, 0.14)',
    border: 'rgba(167, 139, 250, 0.45)',
    pillText: '#c4b5fd',
  },
  rose: {
    hex: '#fb7185',
    softBg: 'rgba(251, 113, 133, 0.14)',
    border: 'rgba(251, 113, 133, 0.45)',
    pillText: '#fda4af',
  },
  cyan: {
    hex: '#06b6d4',
    softBg: 'rgba(6, 182, 212, 0.14)',
    border: 'rgba(6, 182, 212, 0.45)',
    pillText: '#67e8f9',
  },
  amber: {
    hex: '#f59e0b',
    softBg: 'rgba(245, 158, 11, 0.14)',
    border: 'rgba(245, 158, 11, 0.48)',
    pillText: '#fcd34d',
  },
};

export const ACCENT_PALETTE = OG_ACCENTS;

export const FONT_URLS = {
  interBold:
    'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-700-normal.woff',
  interSemi:
    'https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-600-normal.woff',
  jbMonoBold:
    'https://cdn.jsdelivr.net/gh/JetBrains/JetBrainsMono@v2.304/fonts/ttf/JetBrainsMono-Bold.ttf',
  jbMonoReg:
    'https://cdn.jsdelivr.net/gh/JetBrains/JetBrainsMono@v2.304/fonts/ttf/JetBrainsMono-Regular.ttf',
} as const;

export const LOCAL_FONT_FILES = {
  interBold: 'inter-latin-700-normal.woff',
  interSemi: 'inter-latin-600-normal.woff',
  jbMonoBold: 'JetBrainsMono-Bold.ttf',
  jbMonoReg: 'JetBrainsMono-Regular.ttf',
} as const;

type FontKey = keyof typeof FONT_URLS;

async function readLocalFontBuffer(filename: string): Promise<ArrayBuffer | null> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'app', 'labs', 'fonts', filename);
    const bytes = await readFile(filePath);
    if (bytes.byteLength === 0) return null;
    return bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    );
  } catch {
    return null;
  }
}

async function fetchFontBuffer(
  url: string,
  timeoutMs = 1500,
  customFetcher?: typeof fetch
): Promise<ArrayBuffer | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const activeFetch = customFetcher ?? fetch;
    const init: RequestInit & { next?: { revalidate: number } } = customFetcher
      ? { signal: controller.signal }
      : {
          next: { revalidate: 86400 },
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(timeoutMs),
          ]),
        };

    const res = await Promise.race<Response | null>([
      activeFetch(url, init),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), timeoutMs + 25);
      }),
    ]);

    if (!res || !res.ok) return null;
    const buf = await res.arrayBuffer();
    return buf.byteLength > 0 ? buf : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveFontBuffer(
  key: FontKey,
  options: LoadOgFontsOptions
): Promise<ArrayBuffer | null> {
  const preferLocal = options.preferLocal ?? true;
  if (preferLocal) {
    const localBuf = await readLocalFontBuffer(LOCAL_FONT_FILES[key]);
    if (localBuf) return localBuf;
  }
  return fetchFontBuffer(
    FONT_URLS[key],
    options.timeoutMs ?? 1500,
    options.fetcher
  );
}

export async function loadOgFontsWithMeta(
  options: LoadOgFontsOptions = {}
): Promise<LoadedOgFonts> {
  const [interBold, interSemi, jbMonoBold, jbMonoReg] = await Promise.all([
    resolveFontBuffer('interBold', options),
    resolveFontBuffer('interSemi', options),
    resolveFontBuffer('jbMonoBold', options),
    resolveFontBuffer('jbMonoReg', options),
  ]);

  const fonts: SatoriFontConfig[] = [];
  if (interBold) {
    fonts.push({ name: 'Inter', data: interBold, weight: 700, style: 'normal' });
  }
  if (interSemi) {
    fonts.push({ name: 'Inter', data: interSemi, weight: 600, style: 'normal' });
  }
  if (jbMonoBold) {
    fonts.push({
      name: 'JetBrains Mono',
      data: jbMonoBold,
      weight: 700,
      style: 'normal',
    });
  }
  if (jbMonoReg) {
    fonts.push({
      name: 'JetBrains Mono',
      data: jbMonoReg,
      weight: 400,
      style: 'normal',
    });
  }

  return {
    fonts,
    hasBoxDrawingGlyphs: Boolean(jbMonoBold || jbMonoReg),
  };
}

export async function loadOgFonts(
  options: LoadOgFontsOptions = {}
): Promise<SatoriFontConfig[]> {
  const { fonts } = await loadOgFontsWithMeta(options);
  return fonts;
}

export function normalizeDiagramLine(
  line: string,
  hasBoxDrawingGlyphs = true
): string {
  if (hasBoxDrawingGlyphs) {
    return line;
  }
  return line
    .replace(/[┌┐└┘├┤┬┴┼]/g, '+')
    .replace(/─/g, '-')
    .replace(/│/g, '|')
    .replace(/▼/g, 'v');
}

export function resolveLabBlueprint(
  rawSlug: string | null | undefined
): LabBlueprint {
  const slug = resolveLabSlug(rawSlug);
  return LAB_BLUEPRINTS_BY_SLUG[slug] ?? LAB_BLUEPRINTS[0]!;
}
