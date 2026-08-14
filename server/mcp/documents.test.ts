import { describe, it, expect } from "vitest";
import { generatePdfLetterhead, generateDocx, generatePptx, generateXlsx } from "./documents/index.ts";

describe("documents MCP helpers", () => {
  it("generates PDF dataUrl with correct prefix", async () => {
    const r = await generatePdfLetterhead("Test", "Hello world ".repeat(20));
    expect(r.ok).toBe(true);
    expect(r.dataUrl).toMatch(/^data:application\/pdf;base64,/);
    expect(r.dataUrl!.length).toBeGreaterThan(100);
  });

  it("rejects empty PDF", async () => {
    const r = await generatePdfLetterhead("", "");
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/required/);
  });

  it("generates DOCX dataUrl", async () => {
    const r = await generateDocx("Title", [{ text: "Sec 1" }, { text: "Sec 2" }]);
    expect(r.ok).toBe(true);
    expect(r.dataUrl).toMatch(/^data:application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document;base64,/);
  });

  it("generates PPTX dataUrl", async () => {
    const r = await generatePptx("Deck", [{ title: "S1", body: "Body" }]);
    expect(r.ok).toBe(true);
    expect(r.dataUrl).toMatch(/^data:application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation;base64,/);
  });

  it("generates XLSX dataUrl with correct MIME colon", async () => {
    const r = await generateXlsx("Report", [["H1", "H2"], [1, 2], [3, 4]]);
    expect(r.ok).toBe(true);
    expect(r.dataUrl).toMatch(/^data:application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet;base64,/);
    expect(r.dataUrl).not.toMatch(/^data\/application/);
  });

  it("wraps long PDF content across pages", async () => {
    const long = "Lorem ipsum dolor sit amet ".repeat(500);
    const r = await generatePdfLetterhead("Long Doc", long);
    expect(r.ok).toBe(true);
    // PDF with many words should be >5KB base64
    expect(r.dataUrl!.length).toBeGreaterThan(5000);
  });
});
