import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { chunkText } from "./chunk.ts";
import { embedTexts, embedQuery } from "./embed.ts";
import { addDocs, queryIndex, indexStats, clearIndex, removeBySource, loadIndex } from "./store.ts";
import { extractText, isSupported, displaySource } from "./ingest.ts";

export const DEFAULT_COMPANY = "default";

export async function ingestFile(filePath: string, companyId = DEFAULT_COMPANY): Promise<{ chunks: number; source: string }> {
  const source = displaySource(filePath);
  const raw = await extractText(filePath);
  const chunks = chunkText(raw, source);
  if (!chunks.length) return { chunks: 0, source };
  const vectors = await embedTexts(chunks.map((c) => c.text));
  addDocs(companyId, chunks, vectors);
  return { chunks: chunks.length, source };
}

export async function ingestFolder(folderPath: string, companyId = DEFAULT_COMPANY): Promise<{ files: number; chunks: number }> {
  if (!existsSync(folderPath)) throw new Error(`Folder not found: ${folderPath}`);
  const entries = readdirSync(folderPath);
  let files = 0;
  let chunks = 0;
  for (const e of entries) {
    const p = join(folderPath, e);
    const st = statSync(p);
    if (st.isDirectory()) {
      const sub = await ingestFolder(p, companyId);
      files += sub.files;
      chunks += sub.chunks;
    } else if (st.isFile() && isSupported(p) && st.size < 25 * 1024 * 1024) {
      try {
        const r = await ingestFile(p, companyId);
        files += 1;
        chunks += r.chunks;
      } catch (err) {
        console.warn(`[rag] skip ${p}:`, err);
      }
    }
  }
  return { files, chunks };
}

export async function ingestText(text: string, source: string, companyId = DEFAULT_COMPANY) {
  const chunks = chunkText(text, source);
  if (!chunks.length) return { chunks: 0, source };
  const vectors = await embedTexts(chunks.map((c) => c.text));
  addDocs(companyId, chunks, vectors);
  return { chunks: chunks.length, source };
}

export async function ragQuery(query: string, companyId = DEFAULT_COMPANY, topK = 5) {
  const qvec = await embedQuery(query);
  const hits = queryIndex(companyId, qvec, topK);
  return hits.map((h) => ({ text: h.text, source: h.source, score: h.score, chunkIndex: h.chunkIndex }));
}

export function ragStats(companyId = DEFAULT_COMPANY) {
  return indexStats(companyId);
}

export function ragClear(companyId = DEFAULT_COMPANY) {
  clearIndex(companyId);
}

export function ragRemoveSource(source: string, companyId = DEFAULT_COMPANY) {
  return removeBySource(companyId, source);
}

export function ragList(companyId = DEFAULT_COMPANY) {
  return loadIndex(companyId).slice(0, 200).map((d) => ({ id: d.id, source: d.source, text: d.text.slice(0, 280) }));
}
