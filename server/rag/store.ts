import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR } from "../config.ts";
import { cosine } from "./embed.ts";
import type { Chunk } from "./chunk.ts";

export interface RagDoc {
  id: string;
  text: string;
  source: string;
  vector: number[];
  chunkIndex: number;
  addedAt: number;
}

const RAG_DIR = join(DATA_DIR, "rag");

function indexPath(companyId: string) {
  return join(RAG_DIR, `${companyId}.json`);
}

function ensureDir() {
  mkdirSync(RAG_DIR, { recursive: true });
}

export function loadIndex(companyId: string): RagDoc[] {
  try {
    return JSON.parse(readFileSync(indexPath(companyId), "utf8"));
  } catch {
    return [];
  }
}

export function saveIndex(companyId: string, docs: RagDoc[]) {
  ensureDir();
  writeFileSync(indexPath(companyId), JSON.stringify(docs));
}

export function addDocs(companyId: string, chunks: Chunk[], vectors: number[][]) {
  const existing = loadIndex(companyId);
  const byId = new Map(existing.map((d) => [d.id, d] as const));
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    byId.set(c.id, { id: c.id, text: c.text, source: c.source, vector: vectors[i], chunkIndex: c.chunkIndex, addedAt: Date.now() });
  }
  const next = [...byId.values()];
  saveIndex(companyId, next);
  return next.length;
}

export function removeBySource(companyId: string, source: string) {
  const docs = loadIndex(companyId).filter((d) => d.source !== source);
  saveIndex(companyId, docs);
  return docs.length;
}

export function queryIndex(companyId: string, qvec: number[], topK = 5): Array<RagDoc & { score: number }> {
  const docs = loadIndex(companyId);
  if (!docs.length) return [];
  const scored = docs.map((d) => ({ ...d, score: cosine(qvec, d.vector) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter((s) => s.score > 0.05);
}

export function indexStats(companyId: string) {
  const docs = loadIndex(companyId);
  const sources = new Set(docs.map((d) => d.source));
  return { chunks: docs.length, sources: sources.size, sourceNames: [...sources] };
}

export function clearIndex(companyId: string) {
  saveIndex(companyId, []);
}
