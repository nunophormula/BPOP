// Deteção de biomarcadores e dos seus resultados a partir da tabela
// `biomarkers`/`biomarker_results` (ver server/routes/biomarkers.js) — nunca
// de uma lista fixa no código, para que criar um biomarcador novo na
// Gestão de Dados o torne detetável de imediato, sem alterações aqui.
import { normalizeText } from "./textUtils";
import { extractParamFromCase } from "./paramMatching";

// Biomarcadores cujas keywords (vindas da BD) aparecem no texto do caso.
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

// Resultado é sempre específico do biomarcador — usa a escala de biomarker_results dele, não uma lista genérica.
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
