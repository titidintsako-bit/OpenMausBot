import { Copy, GitBranch, ShieldCheck, AlertTriangle } from "lucide-react";

export function IntegrityView() {
  return (
    <div className="flex h-full flex-1 flex-col bg-card">
      <div className="border-b border-border-subtle px-6 py-4">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>Sessions</span> / <span className="text-foreground">Analyze this document</span>
          <span className="ml-auto rounded-full bg-brand-tint px-2 py-0.5 text-[11px] text-foreground">Private mode</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-6" style={{ maxWidth: "var(--content-max)" }}>
        <div className="mx-auto w-full max-w-[680px]">
          <h3 className="text-[13px] font-semibold text-foreground">Management notes:</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-muted-foreground">
            <li>Customer risk concentrated in Atlas BioSystems, Gradient Health, and Monarch Logistics</li>
            <li>Pipeline strength depends on enterprise security-review clearances</li>
            <li>Workbook is explicitly synthetic/demo-only</li>
          </ul>

          <h3 className="mt-6 flex items-center gap-2 text-[13px] font-semibold text-foreground"><ShieldCheck size={14} className="text-success" /> 7. Checks — Model integrity</h3>
          <div className="mt-1 text-[12px] text-muted-foreground">All 5 checks pass:</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-foreground">
            <li>Revenue model ending ARR tie-out: OK</li>
            <li>Customer ARR populated: OK ($12M = $12M)</li>
            <li>Pipeline weighted ARR tie-out: OK</li>
            <li>Summary exit ARR links correctly to Revenue_Model</li>
            <li className="flex items-center gap-1"><ShieldCheck size={12} className="text-success" /> No real-data flag detected</li>
          </ul>

          <h3 className="mt-6 text-[13px] font-semibold text-foreground">Overall assessment</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            This is a well-structured demo pack with realistic SaaS metrics and governance patterns. The Base Case implies ~22.8% year-over-year ARR growth ($9.25M → $11.36M), with NRR barely above 100% suggesting the company is growth-dependent on new sales rather than expansion.
          </p>
          <div className="mt-3 flex gap-2">
            <button className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent"><Copy size={11} /> Copy</button>
            <button className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-accent"><GitBranch size={11} /> Branch from here</button>
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] text-warning">
            <AlertTriangle size={14} /> IntegrityView is Phase 4 chrome — wiring to real return packs next.
          </div>
        </div>
      </div>
    </div>
  );
}
