// Deteção de biomarcadores e dos seus resultados a partir da tabela
// `biomarkers`/`biomarker_results` (ver server/routes/biomarkers.js) — nunca
// de uma lista fixa no código, para que criar um biomarcador novo na
// Gestão de Dados o torne detetável de imediato, sem alterações aqui.
import { normalizeText } from "./textUtils";
import { extractParamFromCase } from "./paramMatching";

export function detectBiomarkers(text, dbBiomarkers) {
  const clean = normalizeText(text);

  const found = [];

  (dbBiomarkers || []).forEach((biomarker) => {
    const exists = (biomarker.keywords || []).some((kw) =>
      clean.includes(normalizeText(kw))
    );

    if (exists) {
      found.push(biomarker.nome);
    }
  });

  return [...new Set(found)];
}

// Resultado de um diagnóstico é sempre específico do biomarcador detetado
// (cada um tem a sua própria escala de scores) — vem exclusivamente dos
// valores/keywords definidos em biomarker_results, nunca de uma lista
// genérica partilhada entre biomarcadores.
export function extractResultadoForBiomarker(text, biomarkerNome, dbBiomarkers) {
  const biomarkerRecord = (dbBiomarkers || []).find(
    (b) => normalizeText(b.nome) === normalizeText(biomarkerNome)
  );

  if (!biomarkerRecord?.resultados?.length) return null;

  return extractParamFromCase(text, {
    keywords: biomarkerRecord.keywords,
    values: biomarkerRecord.resultados,
  });
}
