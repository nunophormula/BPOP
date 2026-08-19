// Extração de texto de PDF e separação em "casos" (um por diagnóstico) —
// tudo o que é específico do formato PDF vive aqui, isolado do motor
// genérico de deteção/parsing usado depois em cima do texto extraído.
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { dedupeRepeatedLines } from "./textUtils";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Reconhece números de diagnóstico do tipo H2026/1234, B2026/1234,
// 2026001234 ou 1234/H2026 — usado tanto para separar um PDF com vários
// doentes em casos individuais, como para extrair o nº de diagnóstico de
// cada linha de um Excel.
export const DIAGNOSIS_REGEX =
  /\b(?:[HB]?\s*20\d{2}\/\d{3,}(?:-\d+)?|[HB]?\s*20\d{2}\d{3,}|\d{3,}\/[HB]?\s*20\d{2})\b/gi;

// Groups text runs into lines by their Y position instead of flattening
// everything with a single space — needed so dedupeRepeatedLines can spot
// the incrementally-rebuilt, line-by-line duplicated notes these exports
// produce.
function itemsToLines(items) {
  const lines = [];
  let currentY = null;
  let currentLine = [];

  items.forEach((item) => {
    const y = Math.round(item.transform?.[5] ?? 0);

    if (currentY === null || Math.abs(y - currentY) > 2) {
      if (currentLine.length) lines.push(currentLine.join(" "));
      currentLine = [item.str];
      currentY = y;
    } else {
      currentLine.push(item.str);
    }
  });

  if (currentLine.length) lines.push(currentLine.join(" "));

  return lines;
}

export async function extractPdfPages(file) {
  const buffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pagePromises = Array.from({ length: pdf.numPages }, async (_, i) => {
    const page = await pdf.getPage(i + 1);
    const content = await page.getTextContent();

    const text = itemsToLines(content.items).join("\n");

    return {
      page: i + 1,
      text,
    };
  });

  return Promise.all(pagePromises);
}

// Muitos exports hospitalares são uma "listagem de consulta" com vários
// doentes/diagnósticos concatenados num único PDF — corta o texto completo
// em blocos usando as ocorrências do número de diagnóstico.
export function splitCasesByDiagnosis(fullText) {
  if (!fullText) return [];

  const matches = [...fullText.matchAll(DIAGNOSIS_REGEX)];

  // se não encontra nada → 1 caso
  if (matches.length === 0) {
    return [{ diagnosisNumber: null, text: dedupeRepeatedLines(fullText) }];
  }

  const cases = [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];

    const start = match.index;

    const end =
      i < matches.length - 1 ? matches[i + 1].index : fullText.length;

    const caseText = dedupeRepeatedLines(fullText.slice(start, end).trim());

    cases.push({
      diagnosisNumber: match[0].replace(/\s+/g, ""),
      text: caseText,
    });
  }

  return cases;
}
