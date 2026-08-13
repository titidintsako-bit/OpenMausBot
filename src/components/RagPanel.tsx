import { useEffect, useState } from "react";
import { Database, FileText, Search, Trash2, Upload, X, Loader2, FolderUp, Sparkles } from "lucide-react";
import { api } from "@/state/store";

interface RagStats { chunks: number; sources: number; sourceNames: string[]; }

export function RagPanel({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<RagStats | null>(null);
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Array<{ text: string; source: string; score: number }>>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState("");

  const refresh = async () => {
    try { setStats(await api("/api/rag/stats")); } catch {}
  };
  useEffect(() => { void refresh(); }, []);

  const ingest = async () => {
    if (!text.trim()) return;
    setBusy("ingest"); setMsg(null);
    try {
      const r = await api("/api/rag/ingest-text", { method: "POST", body: JSON.stringify({ text, source: source.trim() || "pasted-text.txt" }) });
      setMsg(`Added ${r.chunks} chunks from ${r.source}`);
      setText(""); setSource(""); await refresh();
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : String(e)); }
    setBusy(null);
  };

  const ingestFolder = async () => {
    if (!folderPath.trim()) return;
    setBusy("folder"); setMsg(null);
    try {
      const r = await api("/api/rag/ingest-folder", { method: "POST", body: JSON.stringify({ path: folderPath.trim() }) });
      setMsg(`Indexed ${r.files} files → ${r.chunks} chunks`);
      await refresh();
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : String(e)); }
    setBusy(null);
  };

  const doQuery = async () => {
    if (!query.trim()) return;
    setBusy("query");
    try {
      const r = await api("/api/rag/query", { method: "POST", body: JSON.stringify({ query, topK: 5 }) });
      setHits(r.hits);
      if (!r.hits.length) setMsg("No matches — try indexing some documents first.");
      else setMsg(null);
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : String(e)); }
    setBusy(null);
  };

  const clear = async () => {
    setBusy("clear");
    await api("/api/rag/clear?companyId=default", { method: "DELETE" });
    setHits([]); await refresh(); setMsg("Knowledge base cleared."); setBusy(null);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onMouseDown={onClose} />
      <div className="relative flex h-full w-[480px] max-w-[92vw] flex-col border-l border-hairline/40 bg-panel shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-hairline/40 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Database size={18} />
            </div>
            <div>
              <div className="text-[15px] font-semibold text-ink">Knowledge</div>
              <div className="text-[11px] text-ink-secondary">Local-first · POPIA-friendly · never leaves your machine</div>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-ink-secondary hover:bg-raised hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* stats */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-raised/60 px-3 py-2.5">
              <div className="text-[11px] tracking-widest text-ink-secondary">CHUNKS</div>
              <div className="text-[18px] font-semibold text-ink">{stats?.chunks ?? "—"}</div>
            </div>
            <div className="rounded-xl bg-raised/60 px-3 py-2.5">
              <div className="text-[11px] tracking-widest text-ink-secondary">SOURCES</div>
              <div className="text-[18px] font-semibold text-ink">{stats?.sources ?? "—"}</div>
            </div>
            <div className="rounded-xl bg-card px-3 py-2.5 ring-1 ring-accent/20">
              <div className="text-[11px] tracking-widest text-accent flex items-center gap-1"><Sparkles size={10}/> AUTO-RAG</div>
              <div className="text-[11px] leading-tight text-ink-secondary">Every message is enriched with citations automatically</div>
            </div>
          </div>
          {stats?.sourceNames?.length ? (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {stats.sourceNames.slice(0, 12).map((s) => (
                <span key={s} className="inline-flex items-center gap-1 rounded-full bg-raised px-2.5 py-1 text-[11px] text-ink-secondary">
                  <FileText size={11} /> {s}
                </span>
              ))}
            </div>
          ) : (
            <div className="mb-4 rounded-xl border border-dashed border-hairline/50 px-3 py-3 text-center text-[12px] text-ink-secondary">
              No documents yet — paste text or point at a folder below.
            </div>
          )}

          {msg && <div className="mb-3 rounded-lg bg-raised px-3 py-2 text-[12px] text-ink-secondary">{msg}</div>}

          {/* paste ingest */}
          <div className="mb-4 rounded-xl border border-hairline/40 bg-card p-3">
            <div className="mb-2 text-[12px] font-medium tracking-widest text-ink-secondary">ADD TEXT</div>
            <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source name e.g. SARS-VAT201-guide.pdf" className="mb-2 w-full rounded-lg bg-raised/70 px-3 py-2 text-[13px] text-ink placeholder:text-ink-secondary focus:outline-none" />
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your document, policy, prior-year note…" rows={5} className="w-full rounded-lg bg-raised/70 px-3 py-2 text-[13px] text-ink placeholder:text-ink-secondary focus:outline-none" />
            <button onClick={ingest} disabled={busy !== null || !text.trim()} className="mt-2 inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white hover:brightness-110 disabled:opacity-40">
              {busy === "ingest" ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Index this text
            </button>
          </div>

          {/* folder ingest */}
          <div className="mb-4 rounded-xl border border-hairline/40 bg-card p-3">
            <div className="mb-2 text-[12px] font-medium tracking-widest text-ink-secondary">ADD FOLDER (PDF · DOCX · XLSX · MD · TXT)</div>
            <div className="flex gap-2">
              <input value={folderPath} onChange={(e) => setFolderPath(e.target.value)} placeholder="C:\Users\you\Documents\compliance" className="flex-1 rounded-lg bg-raised/70 px-3 py-2 text-[13px] text-ink placeholder:text-ink-secondary focus:outline-none" />
              <button onClick={ingestFolder} disabled={busy !== null} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-raised px-3 py-2 text-[13px] text-ink hover:bg-raised/80 disabled:opacity-40">
                {busy === "folder" ? <Loader2 size={14} className="animate-spin" /> : <FolderUp size={14} />} Index
              </button>
            </div>
            <div className="mt-1 text-[11px] text-ink-secondary">Runs fully locally. The folder is read once — files never leave your machine.</div>
          </div>

          {/* query */}
          <div className="rounded-xl border border-hairline/40 bg-card p-3">
            <div className="mb-2 text-[12px] font-medium tracking-widest text-ink-secondary">TEST RETRIEVAL</div>
            <div className="flex gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && doQuery()} placeholder="What does SARS say about VAT201 late submission?" className="flex-1 rounded-lg bg-raised/70 px-3 py-2 text-[13px] text-ink placeholder:text-ink-secondary focus:outline-none" />
              <button onClick={doQuery} disabled={busy !== null} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white hover:brightness-110 disabled:opacity-40">
                {busy === "query" ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Search
              </button>
            </div>
            {hits.length > 0 && (
              <div className="mt-3 space-y-2">
                {hits.map((h, i) => (
                  <div key={i} className="rounded-lg bg-raised/60 px-3 py-2.5">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-medium tracking-widest text-accent">{h.source}</span>
                      <span className="text-[11px] text-ink-secondary">{(h.score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="line-clamp-4 text-[12px] leading-relaxed text-ink-secondary">{h.text.slice(0, 600)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-hairline/40 px-5 py-3">
          <button onClick={clear} disabled={busy !== null} className="inline-flex items-center gap-2 text-[12px] text-danger hover:underline disabled:opacity-40">
            <Trash2 size={13} /> Clear knowledge base
          </button>
        </div>
      </div>
    </div>
  );
}
