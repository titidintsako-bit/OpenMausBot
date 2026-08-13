import { useEffect, useState } from "react";
import { Loader2, Monitor, Square } from "lucide-react";
import { StoreProvider, useStore } from "@/state/store";
import { Onboarding } from "@/components/Onboarding";
import { emailGateDone, initAnalytics } from "@/lib/analytics";
import { Sidebar } from "@/components/Sidebar";
import { ChatView } from "@/components/ChatView";
import { GroupView } from "@/components/GroupView";
import { SettingsPanel } from "@/components/SettingsPanel";
import { PluginsPanel } from "@/components/PluginsPanel";
import { ComputerPanel } from "@/components/ComputerPanel";
import { AppSettingsPanel } from "@/components/AppSettingsPanel";
import { RagPanel } from "@/components/RagPanel";
import { UpdateBanner } from "@/components/UpdateBanner";
import { ModelPicker } from "@/components/ModelPicker";
import { MausAvatar } from "@/components/Avatar";
import { stateForBot } from "@/lib/mascot";
import { cn } from "@/lib/cn";

function Shell() {
  const { state, dispatch } = useStore();
  const group = state.groups.find((g) => g.id === state.selectedId);
  const bot = group ? undefined : (state.bots.find((b) => b.id === state.selectedId) ?? state.bots[0]);

  // App-wide shortcuts: ⌘N new bot · ⌘1–9 jump to bot · ⌘⇧[ / ⌘⇧] prev/next.
  // Kept deliberately small; every panel already closes on Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const bots = state.bots.filter((b) => !b.hidden);
      if (e.key === "n" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "newBot" });
      } else if (/^[1-9]$/.test(e.key)) {
        const target = bots[Number(e.key) - 1];
        if (target) {
          e.preventDefault();
          dispatch({ type: "select", id: target.id });
        }
      } else if (e.shiftKey && (e.key === "[" || e.key === "]")) {
        const idx = bots.findIndex((b) => b.id === state.selectedId);
        const next = bots[(idx + (e.key === "]" ? 1 : -1) + bots.length) % bots.length];
        if (next) {
          e.preventDefault();
          dispatch({ type: "select", id: next.id });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.bots, state.selectedId, dispatch]);

  const isWin = (window as unknown as { ogb?: { platform?: string } }).ogb?.platform === "win32";
  const drag = isWin ? ({ WebkitAppRegion: "drag" } as React.CSSProperties) : undefined;
  const noDrag = isWin ? ({ WebkitAppRegion: "no-drag" } as React.CSSProperties) : undefined;
  const mascotMotion = bot ? (state.mascotMotion?.botId === bot.id ? state.mascotMotion : null) : null;

  return (
    <div className="app-shell">
      <UpdateBanner />
      <Sidebar />
      <div className="main-panel">
        <div className="detail-bar" style={drag}>
          {bot ? (
            <>
              <button onClick={() => dispatch({ type: "toggleSettings" })} className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 pr-3 hover:bg-accent" style={noDrag}>
                <MausAvatar color={bot.color} state={stateForBot({ ...bot, messages: bot.messages })} size={18} motion={mascotMotion?.kind ?? "none"} motionKey={mascotMotion?.nonce ?? 0} />
                <span className="text-[13px] font-medium text-foreground">{bot.name}</span>
                {bot.busy && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
              </button>
              <div className="ml-auto flex items-center gap-1.5" style={noDrag}>
                {bot.busy && (
                  <button onClick={() => dispatch({ type: "interrupt", botId: bot.id })} className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[12px] text-muted-foreground hover:bg-accent">
                    <Square size={11} className="fill-current" />
                    Stop
                  </button>
                )}
                <ModelPicker bot={bot} />
                <button onClick={() => dispatch({ type: "toggleComputer" })} className={cn("rounded-md p-1.5 hover:bg-accent", state.computerOpen ? "text-primary" : "text-muted-foreground hover:text-foreground")} title="Bot's computer">
                  <Monitor size={16} />
                </button>
              </div>
            </>
          ) : group ? (
            <>
              <span className="truncate text-foreground">{group.name}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">Room · {group.memberIds.length} bots</span>
            </>
          ) : (
            <>
              <span className="truncate text-foreground">ComplyOS</span>
              <span className="ml-auto text-[11px] text-muted-foreground">Local-first · POPIA-ready</span>
            </>
          )}
          {isWin && <span className="w-[88px] shrink-0" aria-hidden />}
        </div>
        <div className="main-panel-body">
          {group ? (
            <GroupView key={group.id} group={group} />
          ) : bot ? (
            <ChatView bot={bot} />
          ) : (
            <main className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" />
              <div className="text-[14px]">
                {state.connected ? "No bots yet" : "Connecting to the bot server…"}
              </div>
              {!state.connected && (
                <div className="text-[12px]">
                  Start it with <code className="rounded bg-muted px-1.5 py-0.5">pnpm dev:server</code>
                </div>
              )}
            </main>
          )}
        </div>
      </div>
      {state.settingsOpen && bot && <SettingsPanel bot={bot} />}
      {state.computerOpen && bot && <ComputerPanel bot={bot} />}
      {state.appSettingsOpen && <AppSettingsPanel />}
      {state.pluginsOpen && <PluginsPanel />}
      {state.ragOpen && <RagPanel onClose={() => dispatch({ type: "toggleRag", open: false })} />}
    </div>
  );
}

export default function App() {
  const [gated, setGated] = useState(() => !emailGateDone());
  useEffect(() => {
    initAnalytics();
    const stored = localStorage.getItem("complyos:theme") as "light" | "dark" | null;
    document.documentElement.setAttribute("data-theme", stored === "dark" ? "dark" : "light");
  }, []);
  return (
    <StoreProvider>
      <Shell />
      {gated && <Onboarding onDone={() => setGated(false)} />}
    </StoreProvider>
  );
}
