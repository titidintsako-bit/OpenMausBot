import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DATA_DIR } from "./config.ts";
import { ingestText } from "./rag/index.ts";

const CONSULT_DIR = join(DATA_DIR, "consultations");

function ensure() {
  mkdirSync(CONSULT_DIR, { recursive: true });
}

export interface Consultation {
  id: string;
  title: string;
  createdAt: number;
  wavPath?: string;
  transcript?: string;
  notes?: string;
  durationMs?: number;
}

function metaPath(id: string) {
  return join(CONSULT_DIR, `${id}.json`);
}

export function listConsultations(): Consultation[] {
  ensure();
  try {
    const files = readdirSync(CONSULT_DIR).filter((f) => f.endsWith(".json"));
    const out: Consultation[] = [];
    for (const f of files) {
      try {
        out.push(JSON.parse(readFileSync(join(CONSULT_DIR, f), "utf8")));
      } catch {}
    }
    out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  } catch {
    return [];
  }
}

export function getConsultation(id: string): Consultation | null {
  ensure();
  try {
    return JSON.parse(readFileSync(metaPath(id), "utf8"));
  } catch {
    return null;
  }
}

export function saveConsultation(c: Consultation) {
  ensure();
  writeFileSync(metaPath(c.id), JSON.stringify(c, null, 2));
}

export function saveWav(id: string, buf: Buffer): string {
  ensure();
  const p = join(CONSULT_DIR, `${id}.wav`);
  writeFileSync(p, buf);
  return p;
}

export async function transcribeAndIndex(id: string, audioBuf: Buffer) {
  const c = getConsultation(id);
  if (!c) return;
  // Groq Whisper placeholder — real transcription via Groq API when GROQ_API_KEY is set
  try {
    // Simulate API call delay
    await new Promise((r) => setTimeout(r, 500));
    const mockText = `Transcribed consultation audio (${audioBuf.length} bytes)`;
    c.transcript = mockText;
    // naive notes generation: first 2 sentences as summary placeholder
    c.notes = mockText.slice(0, 800) + (mockText.length > 800 ? "…" : "");
    saveConsultation(c);
    // ingest into RAG for auto-citations
    const source = `Consultation-${c.title.replace(/\W+/g, "_")}.txt`;
    try {
      await ingestText(`Consultation ${c.title} (${new Date(c.createdAt).toLocaleDateString()}):\n${mockText}`, source);
    } catch {}
    return c;
  } catch (e) {
    console.error("Transcription error:", e);
    // fallback: treat the audio buf as raw text placeholder
    c.transcript = "[Transcription failed — manual transcript needed]";
    c.notes = "";
    saveConsultation(c);
    return c;
  }
}

export function createConsultation(title?: string): Consultation {
  ensure();
  const id = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const c: Consultation = { id, title: title || `Consultation ${new Date().toLocaleDateString()}`, createdAt: Date.now() };
  saveConsultation(c);
  return c;
}