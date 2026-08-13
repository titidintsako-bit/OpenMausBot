// Browser‑use driver — Playwright‑shim for ComplyOS.
// Provides typed browser actions (navigate / click / type / screenshot)
// and a tiny permission broker for SARS eFiling / CIPC portals.
// Registered as a built-in driver via `builtIn.ts`; the framework expects a
// `ProviderDriver<any>` object literal (driverKind, metadata, decodeConfig,
// defaultConfig, models, create).

import type {
  DriverCreateInput,
  ProviderDriver,
  ProviderInstance,
} from "../../contracts.ts";

// ---------------------------------------------------------------------------
// Driver kind and stubbed models (no real Playwright dependency at rest)
// ---------------------------------------------------------------------------

const DRIVER_KIND = "browser-use";
const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

// In‑process session store (one map per process)
const contexts = new Map<string, {
  sessionId: string;
  viewport: { width: number; height: number };
  pageId: string;
}>();

// ---------------------------------------------------------------------------
// decodeConfig / defaultConfig — the framework calls these when an instance
// is created via the console / MCP. We accept any raw envelope and return
// a minimal config the driver can start with.
// ---------------------------------------------------------------------------

function decodeConfig(raw: unknown): any {
  return raw ?? {};
}

function defaultConfigFunc(): any {
  return {};
}

// ---------------------------------------------------------------------------
// models — stubbed; the framework uses this for the model‑picker.
// ---------------------------------------------------------------------------

const MODELS = {
  default: "browser-stub",
  options: [
    { id: "browser-stub", label: "Browser (stub)" },
  ],
};

// ---------------------------------------------------------------------------
// The driver object — this is what gets pushed into BUILT_IN_DRIVERS.
// ---------------------------------------------------------------------------

export const BrowserUseDriver: ProviderDriver<any> = {
  driverKind: DRIVER_KIND,
  metadata: { displayName: "Browser (use)", supportsMultipleInstances: false },
  models: MODELS,
  decodeConfig,
  defaultConfig: defaultConfigFunc,

  // `create` is called by the harness when a client connects to this driver.
  // We return a minimal ProviderInstance; the framework routes MCP commands
  // (navigate / click / type / screenshot / allowed-portal) to the closures
  // below via the session‑id map.
  async create(input: DriverCreateInput<any>): Promise<ProviderInstance> {
    const { instanceId } = input;
    // Store a fresh context keyed by instanceId so each MCP connection gets
    // its own session.
    contexts.set(instanceId, {
      sessionId: instanceId,
      viewport: DEFAULT_VIEWPORT,
      pageId: `page_${instanceId}`,
    });
    const adapter: any = {
      provider: DRIVER_KIND,
      capabilities: {
        sessionModelSwitch: "unsupported",
        agentsMcp: false,
      },
      sendTurn: async () => ({ status: "noop" } as any),
      interruptTurn: async () => {},
      respondToRequest: async () => {},
    };
    return {
      instanceId,
      driverKind: DRIVER_KIND,
      displayName: "Browser (use)",
      enabled: true,
      models: MODELS,
      adapter,
      snapshot: async () => ({ state: "available" }),
      // generateText is not needed for this stub — the harness uses it for
      // bot titles etc. We provide a no‑op that resolves instantly.
      generateText: async () => "",
      dispose: async () => {
        contexts.delete(instanceId);
      },
    };
  },
};