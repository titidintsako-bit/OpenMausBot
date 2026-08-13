import { FileSpreadsheet, Search, Sparkles } from "lucide-react";
import { useStore, type Bot } from "@/state/store";
import { Composer } from "./Composer";

export function EmptyState({ bot }: { bot: Bot }) {
  const { dispatch } = useStore();
  const pills = [
    { label: "Prepare VAT201", prompt: "Prepare a VAT201 for this period — what do you need from me?", icon: FileSpreadsheet },
    { label: "Check CIPC status", prompt: "Check the CIPC annual return status and draft the filing checklist.", icon: Search },
    { label: "Draft client pack", prompt: "Draft a client pack for year-end — include compliance calendar and risks.", icon: Sparkles },
  ];
  return (
    <div className="hero-wash relative flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-[680px] text-center">
        <h1 className="font-serif leading-tight tracking-tight text-foreground" style={{ fontFamily: "var(--font-serif)", fontSize: "var(--fs-display)" }}>
          What can Comply take off your plate?
        </h1>
        <p className="mx-auto mt-2 max-w-[480px] leading-relaxed text-muted-foreground" style={{ fontSize: "var(--fs-sm)" }}>
          Ask about SARS, CIPC or payroll — Comply runs locally and cites the source.
        </p>
        <div className="mx-auto mt-8 flex max-w-[640px] flex-col gap-3 text-left">
          <Composer bot={bot} />
          <div className="flex flex-wrap justify-center gap-2">
            {pills.map((p) => (
              <button
                key={p.label}
                onClick={() => dispatch({ type: "send", botId: bot.id, text: p.prompt })}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 shadow-sm hover:bg-accent"
                style={{ fontSize: "var(--fs-sm)" }}
              >
                <p.icon size={14} className="text-muted-foreground" />
                {p.label}
              </button>
            ))}
          </div>
          <div className="text-center text-muted-foreground/70" style={{ fontSize: "var(--fs-xs)" }}>
            Comply runs locally. Your files never leave this machine — POPIA-ready.
          </div>
        </div>
      </div>
    </div>
  );
}
