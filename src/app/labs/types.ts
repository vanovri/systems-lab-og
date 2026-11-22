// src/app/labs/types.ts

export type LabSlug =
  | 'vectradb'
  | 'kronos'
  | 'aegis'
  | 'novaserve'
  | 'spectre'
  | 'dst-kv';

export type LabAccent = 'sky' | 'emerald' | 'violet' | 'rose' | 'cyan' | 'amber';
export type ReleaseWave = 'wave0' | 'wave1';
export type TelemetryProvenance = 'VERIFIED_LIVE' | 'STANDBY_PROBE';
export type StudioRuntimeMode = 'REAL_ENGINE_WASM' | 'STANDBY_PROBE_WASM';

export type LabCategory =
  | 'ALL'
  | 'OLAP_SQL'
  | 'MATCHING_LOB'
  | 'COW_SANDBOX'
  | 'LLM_SERVING'
  | 'EBPF_OBSERVABILITY'
  | 'CONSENSUS_DST';

export type PrefetchStatus = 'idle' | 'warming' | 'ready' | 'skipped';

export interface TelemetryMetric {
  label: string;
  value: string;
  unit?: string;
  deltaOrNote: string;
}

export interface SimpleTelemetryMetric {
  id: string;
  label: string;
  value: string;
}

/**
 * Kontrak JSON untuk `/labs/<slug>/telemetry/summary.json` (Wave 1 Rust/WASM Studios)
 */
export interface LabTelemetrySummary {
  schemaVersion: 1;
  slug: LabSlug;
  status?: 'VERIFIED_LIVE' | 'PARTIAL_VERIFY';
  commitSha: string;
  generatedAtIso: string;
  wasmSizeKb: number;
  wasmAssetPath?: string;
  verificationGate: string;
  headlineMetric: TelemetryMetric;
  secondaryMetrics: [TelemetryMetric, TelemetryMetric, TelemetryMetric];
}

/**
 * Kontrak JSON untuk Wave 0 (`dst-kv/visualizer/public/telemetry/summary.json`)
 */
export interface Wave0TelemetrySummary {
  schemaVersion: string;
  slug: LabSlug;
  status: 'VERIFIED_LIVE' | 'PARTIAL_VERIFY';
  commitSha: string;
  verifiedAt: string;
  wasmAssetPath: string;
  wasmSizeKb: number;
  cratesCount: number;
  headlineMetrics: [SimpleTelemetryMetric, SimpleTelemetryMetric, SimpleTelemetryMetric];
}

export interface HydratedLabTelemetry extends LabTelemetrySummary {
  source: 'LIVE_EDGE' | 'STANDBY_PROBE';
  provenance: TelemetryProvenance;
  provenanceNote: string;
  sourceLabel: string;
  verifiedAt: string | null;
  cratesCount: number;
  runtimeMode?: StudioRuntimeMode;
  isRealEngineWasm?: boolean;
  metrics: [SimpleTelemetryMetric, SimpleTelemetryMetric, SimpleTelemetryMetric];
}

export interface LabBlueprint {
  slug: LabSlug;
  code: string;
  title: string;
  subtitle: string;
  category: LabCategory;
  categoryLabel: string;
  repoName: string;
  releaseWave: ReleaseWave;
  /** Bento span pada breakpoint lg:grid-cols-12 (pola simetris 7-5 / 5-7 / 7-5) */
  bentoColSpan: 'lg:col-span-7' | 'lg:col-span-5' | 'lg:col-span-12';
  accentColor: LabAccent;
  cratesCount: number;
  approxLoc: string;
  stackTags: string[];
  summary: string;
  /** Diagram byte/pipeline maksimal 5 baris untuk pixel-budget 1200x630 */
  memoryLayoutTitle: string;
  memoryLayoutDiagram: string[];
  runtimeBadges: string[];
  oracleProof: string;
  fallbackTelemetry: LabTelemetrySummary;
}

export const GITHUB_OWNER =
  process.env.NEXT_PUBLIC_GITHUB_USER?.trim() || 'vanovri';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://ardhyanovri.my.id'
).replace(/\/$/, '');

export const FLAGSHIP_SLUG: LabSlug = 'dst-kv';
export const HUB_SECONDARY_SLUGS: LabSlug[] = ['vectradb', 'kronos', 'aegis', 'novaserve', 'spectre'];
export const HUB_LAB_SLUGS: LabSlug[] = [FLAGSHIP_SLUG, ...HUB_SECONDARY_SLUGS];

export const LAB_BLUEPRINTS: LabBlueprint[] = [
  {
    slug: 'vectradb',
    code: 'SYS-01',
    title: 'VectraDB',
    subtitle: 'Vectorized Columnar OLAP SQL Engine & Cascades Optimizer',
    category: 'OLAP_SQL',
    categoryLabel: 'OLAP SQL',
    repoName: 'vectradb',
    releaseWave: 'wave1',
    bentoColSpan: 'lg:col-span-7',
    accentColor: 'sky',
    cratesCount: 10,
    approxLoc: '31.4k LOC Rust',
    stackTags: [
      '2048-Tuple DataChunk',
      'Umbra ByteView 16B',
      'Neumann-Kemper Unnesting',
      'DPccp Join Order',
      'Grace Hash Spill',
      'PGWire v3',
    ],
    summary:
      'Mesin eksekusi SQL analitik kolumnar dari nol dengan German Strings 16-byte, unnesting subquery berkorelasi penuh ke MarkJoin/SingleJoin, dan eksekutor paralel morsel-driven yang sanggup spill ke disk di bawah batas RAM ketat 32 MB.',
    memoryLayoutTitle: 'UMBRA GERMAN STRING (BYTEVIEW · 16B ALIGNED)',
    memoryLayoutDiagram: [
      '┌──────────────┬───────────────────────────────────────────┐',
      '│ len <= 12B   │ [len: u32 (4B)] [inline_utf8: [u8; 12]]   │',
      '├──────────────┼───────────────────────────────────────────┤',
      '│ len >  12B   │ [len: u32] [prefix: 4B] [buf: u32] [ofs]  │',
      '└──────────────┴───────────────────────────────────────────┘',
    ],
    runtimeBadges: ['WASM SIMD128', 'Umbra ByteView', '32MB Grace Spill'],
    oracleProof: '22/22 TPC-H vs SQLite (SF=0.01) + 25,000 SQLsmith + 5,794 SLT + 8/10 deny(unsafe)',
    fallbackTelemetry: {
      schemaVersion: 1,
      slug: 'vectradb',
      commitSha: 'pending',
      generatedAtIso: '2026-11-22T00:00:00Z',
      wasmSizeKb: 2035,
      wasmAssetPath: '/labs/vectradb/assets/vectra_wasm_bg.wasm',
      verificationGate: 'PENDING summary.json',
      headlineMetric: {
        label: '22/22 TPC-H (SF=0.1)',
        value: 'PENDING summary.json',
        deltaOrNote: 'Run make telemetry-summary in vectradb',
      },
      secondaryMetrics: [
        {
          label: 'SQLsmith + SLT Oracle',
          value: 'PENDING summary.json',
          deltaOrNote: '25,000 SQLsmith + 26 .slt files',
        },
        {
          label: 'Spill Cap & PGWire v3',
          value: 'PENDING summary.json',
          deltaOrNote: '32 MB spill + 32 TCP clients',
        },
        {
          label: 'WASM Studio',
          value: '2035 KB',
          deltaOrNote: 'Real Rust wasm-bindgen ABI',
        },
      ],
    },
  },
  {
    slug: 'kronos',
    code: 'SYS-02',
    title: 'KronosLOB',
    subtitle: 'Zero-Alloc Lock-Free Matching Engine & L3 Hawkes Replay',
    category: 'MATCHING_LOB',
    categoryLabel: 'Matching LOB',
    repoName: 'kronos-lob',
    releaseWave: 'wave0',
    bentoColSpan: 'lg:col-span-5',
    accentColor: 'emerald',
    cratesCount: 12,
    approxLoc: '23.0k LOC Rust',
    stackTags: [
      '64B Cache-Line Slab',
      '64-ary Bitset Ladder',
      'LMAX Disruptor 128B',
      'ITCH 5.0 / OUCH / SBE',
      'Hawkes + Avellaneda-Stoikov',
    ],
    summary:
      'Inti bursa finansial deterministik fixed-point dengan alokasi heap nol pada hot path, penemuan BBO O(1) via pohon bitset 64-ary, protokol biner ITCH/OUCH, dan simulator antrean L3 nanodetik.',
    memoryLayoutTitle: 'CACHE-LINE ORDERNODE (64B EXACT) & 64-ARY LADDER',
    memoryLayoutDiagram: [
      '#[repr(C, align(64))] struct OrderNode { // 1 Cache Line',
      '  order_id: u64, price_ht: i64, vis_qty: u64, hid_qty: u64,',
      '  ts_ns: u64, peak: u32, trader: u32, prev: u32, next: u32,',
      '  flags_tif_stp: u32, level_idx: u32 // 0 heap pointers',
      '} // BBO: L0->L1->L2 tzcnt O(1)',
    ],
    runtimeBadges: ['Lock-Free Ring', 'Slab Arena', 'ITCH/OUCH/SBE'],
    oracleProof: '10,000,000 Differential Orders + HotPath ZeroAllocGuard == 0',
    fallbackTelemetry: {
      schemaVersion: 1,
      slug: 'kronos',
      commitSha: 'pending',
      generatedAtIso: '2026-11-22T00:00:00Z',
      wasmSizeKb: 382,
      wasmAssetPath: '/labs/kronos/assets/kronos_wasm_bg.wasm',
      verificationGate: 'PENDING summary.json',
      headlineMetric: {
        label: '10M Hawkes L3 Rate',
        value: 'PENDING summary.json',
        deltaOrNote: 'Run make telemetry-summary in kronos-lob',
      },
      secondaryMetrics: [
        {
          label: 'Window Latency (p50 / p99)',
          value: 'PENDING summary.json',
          deltaOrNote: 'Hardware benchmark report',
        },
        {
          label: 'Full Disruptor Pipeline',
          value: 'PENDING summary.json',
          deltaOrNote: '0 hot-path heap allocs',
        },
        {
          label: 'WASM Studio',
          value: '382 KB',
          deltaOrNote: 'Real Rust wasm-bindgen ABI',
        },
      ],
    },
  },
  {
    slug: 'aegis',
    code: 'SYS-03',
    title: 'AegisBox',
    subtitle: 'Multi-Tenant Micro-Sandbox & userfaultfd CoW Runtime',
    category: 'COW_SANDBOX',
    categoryLabel: 'CoW Sandbox',
    repoName: 'aegis-box',
    releaseWave: 'wave1',
    bentoColSpan: 'lg:col-span-5',
    accentColor: 'violet',
    cratesCount: 10,
    approxLoc: '24.1k LOC Rust',
    stackTags: [
      'clone3 + pidfd',
      'Sealed memfd Init',
      'Binary-Tree cBPF',
      'openat2 Jail',
      'userfaultfd CoW',
      'Pure-Rust Netlink',
    ],
    summary:
      'Runtime eksekusi kode agen AI berlatensi sub-milidetik dengan lazy paging userfaultfd (wp_enabled), percabangan memori MCTS Copy-on-Write, kompilator Seccomp cBPF pohon biner, dan penangkal 44 vektor eksploitasi kernel.',
    memoryLayoutTitle: 'DEFENSE-IN-DEPTH & LAZY UFFD COW RESTORE FLOW',
    memoryLayoutDiagram: [
      'clone3(NEWUSER|NEWPID|NEWNS|NEWNET|INTO_CGROUP)',
      '  └─> execveat(memfd_sealed, AT_EMPTY_PATH) // 0x0F seals',
      '  └─> pivot_root(".", ".") + openat2(RESOLVE_IN_ROOT)',
      '  └─> seccomp(O(log N) cBPF tree) -> UFFDIO_COPY / WRITEPROTECT',
      '50 Clones x 64MiB = 3200MiB -> 71.20MiB Host PSS (97.77% saved)',
    ],
    runtimeBadges: ['userfaultfd CoW', '4KB Paging', 'Binary-Tree cBPF'],
    oracleProof: '44/44 Red-Team Exploits Contained + 100,000 Syscall Fuzz + 0 Kernel Leaks',
    fallbackTelemetry: {
      schemaVersion: 1,
      slug: 'aegis',
      commitSha: 'pending',
      generatedAtIso: '2026-11-22T00:00:00Z',
      wasmSizeKb: 327,
      wasmAssetPath: '/labs/aegis/assets/aegis_wasm_bg.wasm',
      verificationGate: 'PENDING summary.json',
      headlineMetric: {
        label: 'userfaultfd CoW Restore',
        value: 'PENDING summary.json',
        deltaOrNote: 'Run make telemetry-summary in aegis-box',
      },
      secondaryMetrics: [
        {
          label: '50-Sandbox Herd PSS',
          value: 'PENDING summary.json',
          deltaOrNote: 'smaps_rollup verified CoW',
        },
        {
          label: 'Red-Team & Syscall Fuzz',
          value: 'PENDING summary.json',
          deltaOrNote: '0 FD / mount / zombie leaks',
        },
        {
          label: 'WASM Studio',
          value: '327 KB',
          deltaOrNote: 'Real Rust wasm-bindgen ABI',
        },
      ],
    },
  },
  {
    slug: 'novaserve',
    code: 'SYS-04',
    title: 'NovaServe',
    subtitle: 'PagedAttention, Radix-Cache & Speculative LLM Engine',
    category: 'LLM_SERVING',
    categoryLabel: 'LLM Serving',
    repoName: 'novaserve',
    releaseWave: 'wave0',
    bentoColSpan: 'lg:col-span-7',
    accentColor: 'rose',
    cratesCount: 10,
    approxLoc: '26.5k LOC Rust',
    stackTags: [
      'PagedAttention CoW',
      'LRU Radix Prefix Tree',
      'Chunked Prefill',
      'Exact Speculative K=4',
      'JSON-Schema DFA Mask',
      'SIMD Q4_0 / Q8_0',
    ],
    summary:
      'Mesin serving inferensi LLM dari prinsip pertama tanpa framework ML eksternal: manajemen KV-Cache non-kontigu bebas fragmentasi, berbagi prefix otomatis via Radix Tree, speculative rejection sampling eksak, dan masking tata bahasa JSON-Schema.',
    memoryLayoutTitle: 'PAGED KV-SLAB INDIRECTION & LEVIATHAN REJECTION STEP',
    memoryLayoutDiagram: [
      'Seq A ─┐                 ┌─> PhysBlock #41 (ref=2, Radix Pinned)',
      'Seq B ─┴─> LogicalTable ─┼─> PhysBlock #07 (ref=1, CoW Tail Split)',
      '                         └─> Online-Softmax FlashDecoding Reduce',
      'Speculative(K=4): accept u <= min(1, p(x)/q(x)) else norm(max(0, p-q))',
    ],
    runtimeBadges: ['PagedAttention', 'Prefix Cache', 'Speculative K=4'],
    oracleProof: '5,000 Preemption Batch Chaos Runs + TVD 0.0051..0.0082 (< 0.015) + Miri 6/6',
    fallbackTelemetry: {
      schemaVersion: 1,
      slug: 'novaserve',
      commitSha: 'pending',
      generatedAtIso: '2026-11-22T00:00:00Z',
      wasmSizeKb: 1245,
      wasmAssetPath: '/labs/novaserve/assets/novaserve_wasm.wasm',
      verificationGate: 'PENDING summary.json',
      headlineMetric: {
        label: 'Radix Prefix TTFT',
        value: 'PENDING summary.json',
        deltaOrNote: 'Run make telemetry-summary in novaserve',
      },
      secondaryMetrics: [
        {
          label: 'Chunked Prefill ITL p99',
          value: 'PENDING summary.json',
          deltaOrNote: 'Hardware SLA benchmark report',
        },
        {
          label: 'Speculative K=4 TPOT',
          value: 'PENDING summary.json',
          deltaOrNote: 'Leviathan exact sampling',
        },
        {
          label: 'WASM Studio',
          value: '1245 KB',
          deltaOrNote: 'Real Rust wasm32 JSON FFI',
        },
      ],
    },
  },
  {
    slug: 'spectre',
    code: 'SYS-05',
    title: 'SpectreMesh',
    subtitle: 'eBPF Zero-Instrumentation L7 Profiler, TLS-Intercept Mesh & Static Verifier',
    category: 'EBPF_OBSERVABILITY',
    categoryLabel: 'eBPF Mesh',
    repoName: 'spectre-mesh',
    releaseWave: 'wave1',
    bentoColSpan: 'lg:col-span-7',
    accentColor: 'cyan',
    cratesCount: 10,
    approxLoc: '21.0k LOC Rust/C',
    stackTags: [
      'Pure-Rust ELF64 + BTF CO-RE',
      'eBPF ISA v3 Static Verifier',
      'XDP Token-Bucket Firewall',
      'OpenSSL + Go RET-Uprobe TLS',
      'HTTP/2 HPACK + gRPC + PG + Redis',
      'On/Off-CPU Flamegraph',
    ],
    summary:
      'Agen observabilitas dan keamanan level kernel tanpa libbpf maupun sertifikat MITM: loader ELF64/BTF CO-RE murni di Rust, static verifier domain Tnum offline, intersepsi plaintext OpenSSL & Go crypto/tls via patching RET-offset (anti-crash stack goroutine), parser L7 HPACK/gRPC/PG/Redis, serta differential CPU/Off-CPU flamegraph.',
    memoryLayoutTitle: 'DOUBLE-MAPPED RINGBUF, GO RET-UPROBE & TNUM VERIFIER',
    memoryLayoutDiagram: [
      'Kernel Space: [XDP L3/L4 Drop] + [uprobe SSL_read / Go RET-Offset] + [99Hz sched]',
      '      │ (zero-copy BPF_MAP_TYPE_RINGBUF double-mmap Acquire/Release barrier)',
      '      ▼',
      'User Space:  [Stream Reassembler: HTTP/2 HPACK | gRPC | PGWire | RESP3] -> Flamegraph',
      'Pre-Flight:  Pure-Rust Static Verifier (Tnum bitmask + PtrToPacket range + 512B stack)',
    ],
    runtimeBadges: ['eBPF CO-RE', 'Tnum Verifier', 'Zero-MITM TLS'],
    oracleProof: '50,000/50,000 Live OpenSSL+Go L7 Spans (0 drops) + 133/133 Linux 6.18 Verifier + 110k Fuzz + 8/10 deny(unsafe)',
    fallbackTelemetry: {
      schemaVersion: 1,
      slug: 'spectre',
      commitSha: 'pending',
      generatedAtIso: '2026-11-22T00:00:00Z',
      wasmSizeKb: 256,
      wasmAssetPath: '/labs/spectre/assets/spectre_wasm_bg.wasm',
      verificationGate: 'PENDING summary.json',
      headlineMetric: {
        label: 'XDP Kernel / BpfVm',
        value: 'PENDING summary.json',
        deltaOrNote: 'Run make telemetry-summary in spectre-mesh',
      },
      secondaryMetrics: [
        {
          label: 'L7 Decode & TLS 1.3',
          value: 'PENDING summary.json',
          deltaOrNote: 'OpenSSL 3.5.5 uprobe (0 MITM certs)',
        },
        {
          label: 'Live Mesh Oracle & Verifier',
          value: 'PENDING summary.json',
          deltaOrNote: '50,000 spans + 133/133 Linux 6.18 verifier',
        },
        {
          label: 'WASM Studio',
          value: '256 KB',
          deltaOrNote: 'Real Rust wasm-bindgen ABI',
        },
      ],
    },
  },
  {
    slug: 'dst-kv',
    code: 'SYS-06',
    title: 'DST-KV',
    subtitle: 'Sans-I/O Raft KV Store + Deterministic Fault-Injection Simulator',
    category: 'CONSENSUS_DST',
    categoryLabel: 'Consensus & DST',
    repoName: 'dst-kv',
    releaseWave: 'wave0',
    bentoColSpan: 'lg:col-span-5',
    accentColor: 'amber',
    cratesCount: 6,
    approxLoc: '11.4k LOC Rust',
    stackTags: [
      'Sans-I/O Raft',
      'Pre-Vote + ReadIndex',
      'CRC32C Segmented WAL',
      'Wing-Gong Oracle',
      'Delta Shrinker',
      'WASM Time-Travel UI',
    ],
    summary:
      'Penyimpanan KV terdistribusi Raft Sans-I/O murni dalam Rust dengan simulator kejadian diskret ber-seed tunggal ChaCha8, oracle linearizability Wing-Gong (1993), dan time-travel debugger WebAssembly interaktif.',
    memoryLayoutTitle: 'DETERMINISTIC SIMULATION LOOP (ZERO WALL-CLOCK)',
    memoryLayoutDiagram: [
      '┌─ SimClock (Seed) ──> SimNet (Partition/Drop) ─┐',
      '│                                               │',
      '│  Sans-I/O Raft (Pre-Vote + ReadIndex) ─> WAL  │',
      '│         │                              (CRC)  │',
      '└─> Wing-Gong Oracle (Linearizable Check) <─────┘',
    ],
    runtimeBadges: ['Sans-I/O Raft', 'CRC32C WAL', 'Wing-Gong Oracle'],
    oracleProof: '10,000 Wing-Gong Seeds (0 Violations) + 5-Node OS SIGKILL Chaos',
    fallbackTelemetry: {
      schemaVersion: 1,
      slug: 'dst-kv',
      commitSha: 'pending',
      generatedAtIso: '2026-11-22T00:00:00Z',
      wasmSizeKb: 546,
      wasmAssetPath: '/labs/dst-kv/assets/dst_sim.wasm',
      verificationGate: 'PENDING summary.json',
      headlineMetric: {
        label: 'Wing-Gong Marathon',
        value: 'PENDING summary.json',
        deltaOrNote: 'Run make verify-live in dst-kv',
      },
      secondaryMetrics: [
        {
          label: '5-Node SIGKILL Failover',
          value: 'PENDING summary.json',
          deltaOrNote: 'OS cluster chaos gate',
        },
        {
          label: '7-Class Nemesis MTTR',
          value: 'PENDING summary.json',
          deltaOrNote: '1,500-seed torture',
        },
        {
          label: 'WASM Debugger',
          value: '546 KB',
          deltaOrNote: 'Zero-glue wasm32 ABI',
        },
      ],
    },
  },
];

export const ALL_LAB_SLUGS: LabSlug[] = LAB_BLUEPRINTS.map((bp) => bp.slug);

export const LAB_BLUEPRINTS_BY_SLUG: Record<LabSlug, LabBlueprint> =
  Object.fromEntries(LAB_BLUEPRINTS.map((bp) => [bp.slug, bp])) as Record<
    LabSlug,
    LabBlueprint
  >;

export function isLabSlug(value: string | null | undefined): value is LabSlug {
  if (!value) return false;
  return Object.prototype.hasOwnProperty.call(LAB_BLUEPRINTS_BY_SLUG, value);
}

export function getLabBlueprint(slug: LabSlug): LabBlueprint {
  const match = LAB_BLUEPRINTS_BY_SLUG[slug];
  if (!match) {
    throw new Error(`Unknown lab slug: ${slug}`);
  }
  return match;
}

export function resolveLabSlug(raw: string | null | undefined): LabSlug {
  const normalized = (raw ?? '').trim().toLowerCase();
  if (isLabSlug(normalized)) return normalized;
  return FLAGSHIP_SLUG;
}
