import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Groq, { toFile } from "groq-sdk";
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
  try {
    let text: string;
    const key = process.env.GROQ_API_KEY?.trim();
    if (key) {
      const groq = new Groq({ apiKey: key });
      // groq-sdk expects a File-like; toFile wraps Buffer correctly for Node
      const file = await toFile(audioBuf, `${id}.wav`, { type: "audio/wav" });
      const res: any = await groq.audio.transcriptions.create({
        file,
        model: "whisper-large-v3",
        // response_format: "verbose_json" returns {text, ...}; omit for default json
        temperature: 0,
      });
      text = typeof res === "string" ? res : (res?.text ?? String(res ?? ""));
      if (!text.trim()) text = "[No speech detected]";
    } else {
      await new Promise((r) => setTimeout(r, 500));
      text = `Transcribed consultation audio (${audioBuf.length} bytes) [mock — set GROQ_API_KEY]`;
    }
    c.transcript = text;
    c.notes = text.slice(0, 800) + (text.length > 800 ? "…" : "");
    // estimate duration: assume 16kHz mono 16-bit PCM ~32kB/s after 44B header
    if (!c.durationMs && audioBuf.length > 44) c.durationMs = Math.round(((audioBuf.length - 44) / 32000) * 1000);
    if (!c.wavPath) c.wavPath = join(DATA_DIR, "consultations", `${id}.wav`);
    saveConsultation(c);
    const source = `Consultation-${c.title.replace(/\W+/g, "_")}.txt`;
    try {
      await ingestText(`Consultation ${c.title} (${new Date(c.createdAt).toLocaleDateString()}):\n${text}`, source);
    } catch {}
    return c;
  } catch (e) {
    console.error("Transcription error:", e);
    c.transcript = `[Transcription failed: ${String((e as any)?.message ?? e)} — manual transcript needed]`;
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