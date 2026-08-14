import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("consultations transcribeAndIndex", () => {
  let home: string;
  let origKey: string | undefined;
  let origHome: string | undefined;
  let origUserProfile: string | undefined;

  beforeEach(() => {
    home = mkdtempSync(join(tmpdir(), "omb-consult-test-"));
    origKey = process.env.GROQ_API_KEY;
    origHome = process.env.HOME;
    origUserProfile = process.env.USERPROFILE;
    // isolate DATA_DIR: server/config uses HOME/USERPROFILE
    process.env.HOME = home;
    process.env.USERPROFILE = home;
    delete process.env.GROQ_API_KEY;
  });

  afterEach(() => {
    if (origKey !== undefined) process.env.GROQ_API_KEY = origKey;
    else delete process.env.GROQ_API_KEY;
    if (origHome !== undefined) process.env.HOME = origHome;
    else delete process.env.HOME;
    if (origUserProfile !== undefined) process.env.USERPROFILE = origUserProfile;
    else delete process.env.USERPROFILE;
    rmSync(home, { recursive: true, force: true });
  });

  it("falls back to mock when GROQ_API_KEY absent", async () => {
    const { createConsultation, transcribeAndIndex, getConsultation } = await import("./consultations.ts");
    const c = createConsultation("Test Consult");
    const buf = Buffer.from("fake wav data ".repeat(100));
    const res = await transcribeAndIndex(c.id, buf);
    expect(res?.transcript).toContain("Transcribed consultation audio");
    expect(res?.transcript).toContain("[mock");
    const fetched = getConsultation(c.id);
    expect(fetched?.transcript).toBe(res?.transcript);
    expect(fetched?.wavPath).toBeDefined();
  });

  it("sets durationMs estimate", async () => {
    const { createConsultation, transcribeAndIndex } = await import("./consultations.ts");
    const c = createConsultation("Dur Test");
    const buf = Buffer.alloc(32044); // ~1s after header
    const res = await transcribeAndIndex(c.id, buf);
    expect(res?.durationMs).toBeGreaterThan(500);
  });
});
