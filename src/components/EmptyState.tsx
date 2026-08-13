import { useState } from "react";
import { ArrowUp, FileSpreadsheet, Search, Sparkles } from "lucide-react";

export function EmptyState({ botName, onPrompt }: { botName: string; onPrompt: (text: string) => void }) {
  const pills = [
    { label: "Prepare VAT201", prompt: "Prepare a VAT201 for this period — what do you need from me?", icon: FileSpreadsheet },
    { label: "Check CIPC status", prompt: "Check the CIPC annual return status and draft the filing checklist.", icon: Search },
    { label: "Draft client pack", prompt: "Draft a client pack for year-end — include compliance calendar and risks.", icon: Sparkles },
  ];
  return (
    <div className="hero-wash relative flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-[680px] text-center">
        <h1 className="font-serif text-[28px] leading-tight tracking-tight text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
          What can Comply take off your plate?
        </h1>
        <p className="mx-auto mt-2 max-w-[480px] text-[13px] leading-relaxed text-muted-foreground">
          Ask about SARS, CIPC or payroll — Comply runs locally and cites the source.
        </p>

        {/* centered composer — mirrors ChatView's composer but hero-styled */}
        <div className="mx-auto mt-8 flex max-w-[640px] flex-col gap-3">
          <HeroComposer botName={botName} onPrompt={onPrompt} />
          <div className="flex flex-wrap justify-center gap-2">
            {pills.map((p) => (
              <button
                key={p.label}
                onClick={() => onPrompt(p.prompt)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-[12.5px] text-foreground shadow-sm hover:bg-accent"
              >
                <p.icon size={14} className="text-muted-foreground" />
                {p.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-muted-foreground/70">Comply runs locally. Your files never leave this machine — POPIA-ready.</div>
        </div>
      </div>
    </div>
  );
}

function HeroComposer({ botName, onPrompt }: { botName: string; onPrompt: (text: string) => void }) {
  const [text, setText] = useState("");
  const send = () => {
    const t = text.trim();
    if (t) {
      onPrompt(t);
      setText("");
    }
  };
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-3 shadow-md">
      <textarea
        placeholder={`Ask ${botName} anything, run / to see commands`}
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        className="w-full resize-none bg-transparent px-2 py-1 text-[14px] leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span className="rounded-full border border-border bg-muted px-2 py-1">Local-first</span>
          <span className="hidden sm:inline">Grok 4.5 • Private</span>
        </div>
        <button
          onClick={send}
          disabled={!text.trim()}
          className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-40"
          aria-label="Send"
        >
          <ArrowUp size={16} />
        </button>
      </div>
    </div>
  );
}
