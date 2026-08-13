import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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

  return (
    <div className="app-shell">
      <UpdateBanner />
      <Sidebar />
      <div className="main-panel">
        {/* detail bar — June style breadcrumb, inside the card */}
        <div className="detail-bar">
          <span className="truncate">{group ? group.name : bot ? bot.name : "ComplyOS"}</span>
          {bot && <span className="text-[11px] opacity-60">· {bot.modelSelection.model}</span>}
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
    // apply stored theme on mount (index.html already did pre-paint)
    const stored = (localStorage.getItem("complyos:theme") as "light" | "dark" | "system" | null) ?? "system";
    const resolved = stored === "light" || stored === "dark" ? stored : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", resolved);
  }, []);
  return (
    <StoreProvider>
      <Shell />
      {gated && <Onboarding onDone={() => setGated(false)} />}
    </StoreProvider>
  );
}
