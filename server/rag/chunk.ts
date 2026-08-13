export interface Chunk {
  id: string;
  text: string;
  source: string;
  page?: number;
  chunkIndex: number;
}

export function chunkText(text: string, source: string, opts?: { size?: number; overlap?: number }): Chunk[] {
  const size = opts?.size ?? 800;
  const overlap = opts?.overlap ?? 120;
  const clean = text.replace(/\r\n/g, "\n").replace(/\u0000/g, "").trim();
  if (!clean) return [];
  // split on paragraphs first to keep boundaries, then sliding window
  const paras = clean.split(/\n{2,}/);
  const chunks: Chunk[] = [];
  let buf = "";
  let idx = 0;
  const flush = (t: string) => {
    if (!t.trim()) return;
    // sliding window over long buffers
    if (t.length <= size) {
      chunks.push({ id: `${source}#${idx++}`, text: t.trim(), source, chunkIndex: idx });
    } else {
      let start = 0;
      while (start < t.length) {
        const slice = t.slice(start, start + size).trim();
        if (slice) chunks.push({ id: `${source}#${idx++}`, text: slice, source, chunkIndex: idx });
        start += size - overlap;
        if (start < 0) start = 0;
      }
    }
  };
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > size && buf) {
      flush(buf);
      // keep overlap from tail
      buf = buf.slice(Math.max(0, buf.length - overlap)) + "\n\n" + p;
      if (buf.length > size * 1.6) {
        flush(buf);
        buf = "";
      }
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf.trim()) flush(buf);
  return chunks;
}
