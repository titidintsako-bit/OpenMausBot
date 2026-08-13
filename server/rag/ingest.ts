import { readFileSync } from "node:fs";
import { extname, basename } from "node:path";

export async function extractText(filePath: string): Promise<string> {
  const ext = extname(filePath).toLowerCase();
  if (ext === ".pdf") {
    const buf = readFileSync(filePath);
    const mod: any = await import("pdf-parse");
    const pdfParse = mod.default ?? mod;
    const data = await pdfParse(buf);
    return data.text ?? "";
  }
  if (ext === ".docx") {
    const buf = readFileSync(filePath);
    const mammoth: any = await import("mammoth");
    const res = await mammoth.extractRawText({ buffer: buf });
    return res.value ?? "";
  }
  if (ext === ".xlsx" || ext === ".xls") {
    const ExcelJS: any = await import("exceljs");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(readFileSync(filePath));
    const parts: string[] = [];
    wb.eachSheet((ws: any) => {
      parts.push(`Sheet: ${ws.name}`);
      ws.eachRow((row: any) => {
        const vals = (row.values as unknown[]).slice(1).map((v) => String(v ?? "").trim()).filter(Boolean);
        if (vals.length) parts.push(vals.join(" | "));
      });
    });
    return parts.join("\n");
  }
  // txt, md, csv, etc.
  return readFileSync(filePath, "utf8");
}

export function isSupported(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase();
  return [".pdf", ".docx", ".xlsx", ".xls", ".txt", ".md", ".csv", ".json"].includes(ext);
}

export function displaySource(filePath: string): string {
  return basename(filePath);
}
