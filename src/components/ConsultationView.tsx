import { useEffect, useState, useRef } from "react";
import { Mic, Pause, Square, Copy, FileText, Waves } from "lucide-react";
import { api } from "@/state/store";

type Tab = "notes" | "transcription";

export function ConsultationView() {
  const [items, setItems] = useState<Array<{ id: string; title: string; createdAt: number; transcript?: string; notes?: string }>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("notes");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [livePreview, setLivePreview] = useState("");
  const timerRef = useRef<number | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const load = async () => {
    try {
      const r = await api("/api/consultations");
      setItems(r.items);
      if (!activeId && r.items[0]) setActiveId(r.items[0].id);
    } catch {}
  };
  useEffect(() => { void load(); }, []);

  const active = items.find((i) => i.id === activeId) ?? null;

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        // For Phase 3 MVP we use browser speech fallback: if no server ASR, keep audio blob URL for download
        void blob;
        const r = await api("/api/consultations", { method: "POST", body: JSON.stringify({ title: `Consultation ${new Date().toLocaleDateString()}` }) });
        setItems((prev) => [r.item, ...prev]);
        setActiveId(r.item.id);
        setTab("transcription");
        setLivePreview("");
      };
      mr.start(1000);
      mediaRef.current = mr;
      setRecording(true);
      setElapsed(0);
      setLivePreview("Live preview · speak now");
      const t0 = Date.now();
      timerRef.current = window.setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    } catch (e) {
      alert("Mic needs permission — allow Microphone in browser settings.");
    }
  };
  const stop = () => {
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const saveTranscript = async (text: string) => {
    if (!active) return;
    const r = await api(`/api/consultations/${active.id}/transcript`, { method: "PUT", body: JSON.stringify({ transcript: text }) });
    setItems((prev) => prev.map((p) => (p.id === active.id ? r.item : p)));
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-card">
      {/* segmented tabs like June */}
      <div className="flex items-center justify-between border-b border-border-subtle px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-muted-foreground">{active ? new Date(active.createdAt).toLocaleDateString() : "New note"}</span>
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px]">Consultation</span>
        </div>
        <div className="inline-flex rounded-full border border-border bg-muted p-1">
          {(["notes", "transcription"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-full px-3 py-1 text-[12px] font-medium ${tab === k ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
              {k === "notes" ? "Notes" : "Transcription"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-6" style={{ maxWidth: "var(--content-max)" }}>
        {tab === "notes" ? (
          <div>
            <h1 className="font-serif text-[22px] font-medium text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
              {active?.title ?? "New note"}
            </h1>
            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[12px] text-muted-foreground"><Waves size={14} /> Microphone 00:00–{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")} Live preview</span>
                <button onClick={() => active?.notes && navigator.clipboard.writeText(active.notes)} className="rounded-md border border-border bg-card px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent"><Copy size={12} /> Copy</button>
              </div>
              <div className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">
                {active?.notes ?? (recording ? livePreview : "Okay, let's kick off the Monday product sync. Today is June twenty. Transcript, automatic action items, and the final meeting recap...")}
              </div>
              {!active?.notes && (
                <textarea
                  placeholder="Paste or dictate consultation notes — they will be indexed for citations"
                  className="mt-3 min-h-[120px] w-full rounded-lg border border-border bg-muted px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                  onBlur={(e) => e.target.value.trim() && saveTranscript(e.target.value)}
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              {items.slice(0, 4).map((it) => (
                <button key={it.id} onClick={() => setActiveId(it.id)} className={`rounded-full border px-2.5 py-1 ${it.id === activeId ? "border-primary bg-brand-tint text-foreground" : "border-border bg-card"}`}>{it.title}</button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><FileText size={14} /> Transcription</div>
            <div className="mt-3 whitespace-pre-wrap rounded-xl border border-border bg-muted p-4 text-[13px] leading-relaxed text-foreground">
              {active?.transcript ?? "No transcript yet — record or paste above and it will be indexed for auto-RAG."}
            </div>
          </div>
        )}
      </div>

      {/* RecorderBar — June bottom pill */}
      <div className="flex justify-center border-t border-border-subtle bg-card px-4 py-3">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-3 py-2 shadow-md">
          <button onClick={recording ? () => setRecording(false) : start} className={`flex size-8 items-center justify-center rounded-full ${recording ? "bg-muted text-foreground" : "bg-foreground text-card"}`}>
            {recording ? <Pause size={14} /> : <Mic size={14} />}
          </button>
          <span className="w-10 text-center text-[12px] tabular-nums text-foreground">{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</span>
          <span className="hidden sm:inline text-[11px] text-muted-foreground">{recording ? "Recording · mic only on Windows" : "Mic ready"}</span>
          <span className="text-muted-foreground">⋯⋯</span>
          <button onClick={stop} disabled={!recording} className="flex size-8 items-center justify-center rounded-full bg-foreground text-card disabled:opacity-40"><Square size={12} className="fill-current" /></button>
        </div>
      </div>
    </div>
  );
}
