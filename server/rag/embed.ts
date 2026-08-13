let pipe: any = null;
let loading: Promise<any> | null = null;

async function getPipeline() {
  if (pipe) return pipe;
  if (!loading) {
    loading = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      // all-MiniLM-L6-v2 = 384 dims, CPU-friendly, good for local-first
      pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { quantized: true });
      return pipe;
    })();
  }
  pipe = await loading;
  return pipe;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  // small texts: hash fallback if transformers not available (offline)
  try {
    const extractor = await getPipeline();
    const out: number[][] = [];
    for (const t of texts) {
      const res = await extractor(t, { pooling: "mean", normalize: true });
      out.push(Array.from(res.data as Float32Array));
    }
    return out;
  } catch {
    // fallback: deterministic hash embedding (384 dims) so indexing never blocks
    return texts.map(hashEmbed);
  }
}

export async function embedQuery(text: string): Promise<number[]> {
  const [v] = await embedTexts([text]);
  return v;
}

function hashEmbed(text: string): number[] {
  const dims = 384;
  const vec = new Array(dims).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  for (const w of words) {
    let h = 2166136261;
    for (let i = 0; i < w.length; i++) h = Math.imul(h ^ w.charCodeAt(i), 16777619);
    const idx = Math.abs(h) % dims;
    vec[idx] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // already normalized if from embedTexts
}
