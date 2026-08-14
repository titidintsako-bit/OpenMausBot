// Documents driver — ComplyOS document generation MCP.
// Provides typed endpoints for PDF (letterhead), DOCX, PPTX, XLSX generation.
// Uses existing deps: mammoth, pdf-lib, pptxgenjs, exceljs. No runtime Playwright dependency.

import type { ProviderDriver } from "../../contracts.ts";
import { PDFDocument, rgb } from "pdf-lib";
import PptxgenJS from "pptxgenjs";
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph } from "docx";

const DRIVER_KIND = "documents";
const MODELS = {
  default: "documents-stub",
  options: [
    { id: "pdf-letterhead", label: "PDF (letterhead)" },
    { id: "docx-template", label: "DOCX (template)" },
    { id: "pptx-template", label: "PPTX (template)" },
    { id: "xlsx-report", label: "XLSX (financial report)" },
  ],
};

function decodeConfig(raw: unknown): any {
  return raw ?? {};
}

function defaultConfigFunc(): any {
  return {};
}

// ProviderDriver compliance — called by the framework when an instance is created.
export const DocumentsDriver: ProviderDriver<any> = {
  driverKind: DRIVER_KIND,
  metadata: { displayName: "Documents", supportsMultipleInstances: false },
  models: MODELS,
  decodeConfig,
  defaultConfig: defaultConfigFunc,

  async create(input: any): Promise<any> {
    const { instanceId } = input;
    return {
      instanceId,
      driverKind: DRIVER_KIND,
      displayName: "Documents",
      enabled: true,
      models: MODELS,
      adapter: {
        provider: DRIVER_KIND,
        capabilities: {
          sessionModelSwitch: "unsupported",
          agentsMcp: false,
        },
        sendTurn: async () => ({ status: "noop" }),
        interruptTurn: async () => {},
        respondToRequest: async () => {},
      },
      snapshot: async () => ({ state: "available" }),
      generateText: async () => "",
      dispose: async () => {},
    };
  },
};

// ── public MCP helpers (called by server/routes) ──────────────────────────────

export async function generatePdfLetterhead(
  title: string,
  content: string
): Promise<{ ok: boolean; dataUrl?: string; error?: string }> {
  try {
    if (!title?.trim() && !content?.trim()) return { ok: false, error: "title or content required" };
    const pdfDoc = await PDFDocument.create();
    // embed Helvetica to get widthOfTextAtSize for wrapping
    const font = await pdfDoc.embedFont("Helvetica");
    const fontBold = await pdfDoc.embedFont("Helvetica-Bold");
    let page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    const margin = 40;
    const usable = width - margin * 2;

    // Header line in ComplyOS sage green
    page.drawLine({
      start: { x: margin, y: height - 80 },
      end: { x: width - margin, y: height - 80 },
      thickness: 2,
      color: rgb(0.247, 0.51, 0.176), // #3f812f
    });
    page.drawText("COMPLYOS", {
      x: margin,
      y: height - 68,
      size: 10,
      font: fontBold,
      color: rgb(0.247, 0.51, 0.176),
    });

    // Title with wrapping
    let y = height - 110;
    const titleSize = 18;
    const titleLines = wrapText(title || "Untitled", fontBold, titleSize, usable);
    for (const line of titleLines) {
      if (y < 60) {
        page = pdfDoc.addPage([595, 842]);
        y = height - 50;
      }
      page.drawText(line, { x: margin, y, size: titleSize, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      y -= titleSize + 6;
    }
    y -= 8;

    // Content with wrapping — 12pt, line height 16
    const bodySize = 11;
    const bodyLines = wrapText(content ?? "", font, bodySize, usable);
    for (const line of bodyLines) {
      if (y < 50) {
        page = pdfDoc.addPage([595, 842]);
        y = height - 50;
      }
      page.drawText(line, { x: margin, y, size: bodySize, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 16;
    }

    const pdfBytes = await pdfDoc.save();
    const b64 = Buffer.from(pdfBytes).toString("base64");
    return { ok: true, dataUrl: `data:application/pdf;base64,${b64}` };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    const wWidth = font.widthOfTextAtSize(test, size);
    if (wWidth > maxWidth && cur) {
      lines.push(cur);
      cur = w;
      // hard-break very long single word
      while (font.widthOfTextAtSize(cur, size) > maxWidth) {
        let cut = cur.length - 1;
        while (cut > 0 && font.widthOfTextAtSize(cur.slice(0, cut), size) > maxWidth) cut--;
        lines.push(cur.slice(0, cut));
        cur = cur.slice(cut);
      }
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}

export async function generateDocx(
  title: string,
  sections: any[]
): Promise<{ ok: boolean; dataUrl?: string; error?: string }> {
  try {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: title,
            }),
            ...sections.map((s: any) =>
              new Paragraph({
                text: s.text || s.title || "",
              })
            ),
          ],
        },
      ],
    });
    const buf = await Packer.toBuffer(doc);
    const b64 = Buffer.from(buf).toString("base64");
    return { ok: true, dataUrl: `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${b64}` };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function generatePptx(
  title: string,
  slides: any[]
): Promise<{ ok: boolean; dataUrl?: string; error?: string }> {
  try {
    // @ts-ignore - pptxgenjs types don't have construct signature but runtime works
    const pptx = new (PptxgenJS as any)();
    pptx.author = "ComplyOS";
    pptx.title = title || "Presentation";
    // title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addText(title || "Untitled", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 28, color: "3F812F", bold: true });
    slides.forEach((s: any, i: number) => {
      const slide = pptx.addSlide();
      slide.addText(s.title || `Slide ${i + 1}`, { x: 0.5, y: 0.5, w: 9, h: 0.8, fontSize: 20, color: "1A1A1A", bold: true });
      if (s.body) slide.addText(String(s.body), { x: 0.5, y: 1.5, w: 9, h: 3.5, fontSize: 14, color: "333333" });
    });
    const b64 = (await pptx.write({ outputType: "base64" })) as string;
    return { ok: true, dataUrl: `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${b64}` };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function generateXlsx(
  title: string,
  rows: any[][]
): Promise<{ ok: boolean; dataUrl?: string; error?: string }> {
  try {
    const safeTitle = (title?.trim() || "Report").slice(0, 31).replace(/[:\\/?*\[\]]/g, "_");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ComplyOS";
    const worksheet = workbook.addWorksheet(safeTitle);
    // if rows contain header row, use first row as header
    if (rows.length && Array.isArray(rows[0])) {
      const header = rows[0] as any[];
      worksheet.columns = header.map((h, i) => ({ header: String(h ?? `Column ${i + 1}`), key: `c${i}`, width: 18 }));
      worksheet.addRows(rows.slice(1));
      // style header
      worksheet.getRow(1).font = { bold: true, color: { argb: "FF3F812F" } } as any;
    } else {
      worksheet.columns = [{ header: safeTitle, key: "c0", width: 30 }];
      worksheet.addRows(rows as any[]);
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const b64 = Buffer.from(buffer as any).toString("base64");
    return { ok: true, dataUrl: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${b64}` };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}