# Comply consultation recorder — stealing June's audio pipeline properly

> Stolen from `os-clovy/docs/audio-pipeline.md:1` + `src-tauri/src/audio/` (183 lines, lock-free ring, CPAL). This is the long-term target; we ship it in Node first.

## Why this is the ComplyOS wedge

Accountants bill for consultations. A client explains a VAT dispute for 12 minutes, the accountant scribbles, then types a file note. June's pipeline does it hands-free: mic + system audio → turn detection → note generation → RAG-indexed. For ComplyOS that's "record SARS call → auto consultation note → cited in next VAT201 pack". No SA competitor has it.

## What we steal, in order

### Phase 1 — Node shim (this month, Windows-friendly)
- No Rust, no CPAL. Use Web `MediaRecorder` in Electron → `mic.wav` + `system.wav` (Electron `desktopCapturer` + `getUserMedia`).
- On `finish_recording` → same durability commit: rename `*.partial.wav → *.wav` + checkpoint elapsed.
- Batch pipeline in `server/rag/ingest.ts` style: `drop_silent → turn detection (simple VAD) → Whisper via local `whisper.cpp` or hosted `groq/whisper-large-v3` (cheap, private) → note generation via the agent (same harness, same RAG).
- Store: `~/.openmausbot/consultations/{date}.wav` + `transcript.json` + indexed chunks in `server/rag/`. Live preview is optional v1 — we emit transcript events over SSE like `server/harness/bus.ts:1`.

### Phase 2 — Rust swap (when you go Tauri or ship native app)
- Replace `MediaRecorder` with `cpal` + ring buffer (`os-clovy/src-tauri/src/audio/`). Keep the batch pipeline contract (`process_saved_source_audio` → `detect_turns` → `note generation`) so JS glue doesn't change.
- Add `native/meeting-hud` helper for always-on-top pill (01:15 waveform) — port `hud.html` to Electron `BrowserView` with `transparent: true` before rewriting as Tauri window.

## What we deliberately don't steal yet
- `companion/` APNS/phone pairing — later.
- `os-accounts` identity — ComplyOS keeps `config.json` local.

## Reminders queued (as requested)
- **Browser Use** (Playwright MCP) — still parked after RAG. This doc does not replace it; consultations feed RAG, browser acts on portals. Two different memories.
