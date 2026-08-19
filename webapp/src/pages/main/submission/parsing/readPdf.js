// Devolve só dados estruturados — decisões de UI ficam no componente que chama isto.
import { extractPdfPages, splitCasesByDiagnosis } from "./pdfReader";
import {
  extractParamFromCase,
  parseWithContext,
  parsePdfWithSimilarity,
} from "./paramMatching";
import { parseClinicalText } from "./clinicalRules";
import {
  detectBiomarkers,
  extractResultadoForBiomarker,
} from "./biomarkerDetection";
import { getMissingFields } from "./submissionRow";
import { getPatientName } from "./patientNames";

// Extrai o texto do PDF, separa por diagnóstico e corre o motor de deteção/matching sobre cada caso.
export async function readPdfFile(
  file,
  { topografia, params, dbBiomarkers, findTemplate, onProgress }
) {
  const pages = await extractPdfPages(file);

  const fullText = pages.map((p) => p.text).join("\n");

  const cases = splitCasesByDiagnosis(fullText);

  const produtoParam = params.find((p) => p.param_key === "Produto");

  const context = { Topografia: topografia };

  onProgress?.({
    processed: 0,
    total: cases.length,
    text: `${cases.length} diagnósticos encontrados`,
  });

  const parsedPages = [];

  for (let index = 0; index < cases.length; index++) {
    const caseItem = cases[index];
    const text = caseItem.text || "";
    const diagnosisNumber = caseItem.diagnosisNumber;

    const biomarkers = detectBiomarkers(text, dbBiomarkers);

    const matchedTemplates = biomarkers
      .map((biomarker) => findTemplate(biomarker, topografia))
      .filter(Boolean);

    onProgress?.({
      processed: index + 1,
      total: cases.length,
      text: `A analisar diagnóstico ${index + 1} de ${cases.length}`,
    });

    onProgress?.({
      processed: index + 1,
      total: cases.length,
      text: `Diagnóstico ${index + 1}/${cases.length} • ${
        biomarkers.join(", ") || "Sem biomarcador"
      }`,
    });

    const produto = extractParamFromCase(text, produtoParam);

    // a mais bruta: parte o texto inteiro em blocos de 12 palavras (getChunks) e faz fuzzy match (string-similarity) de cada bloco contra os valores/keywords de cada parâmetro, sem se ancorar em nenhuma keyword. Não sabe onde está a keyword do parâmetro no texto — varre tudo às cegas à procura do bloco com maior score (≥0.6).
    const fuzzyParsed = parsePdfWithSimilarity(text, params);
    // mais cirúrgica: procura a primeira ocorrência exata da keyword do parâmetro no texto e usa como contexto só o trecho entre essa keyword e a keyword do parâmetro seguinte (ou, no caso de "Resultado", uma janela de caracteres à volta — getKeywordContexts). Só depois tenta matchValue dentro desse contexto reduzido; se falhar, cai para fuzzy no texto todo.
    const contextualParsed = parseWithContext(text, params);
    // combina duas coisas: extractFromDatabase (clinicalRules.js:8) faz match exato por regex de palavra inteira (\bterm\b) contra os valores da BD — sem fuzzy, sem posição, só presença exata no texto; e applyClinicalRules (clinicalRules.js:39) aplica regras clínicas fixas no código (ex. "tenue"/"fraca" → Intensidade "Fraca"), nada vindo de params.
    const clinicalParsed = parseClinicalText(text, params);

    // A razão de correr as três é que se complementam e são fundidas por ordem de confiança — contextualParsed (a mais precisa) tem prioridade, depois clinicalParsed, e fuzzyParsed fica como rede de segurança quando as outras duas não encontram nada:

    const baseParsed = {
      ...fuzzyParsed,
      ...clinicalParsed,
      ...contextualParsed,

      Produto: produto ?? fuzzyParsed.Produto ?? null,

      ...context,
    };

    const markers = biomarkers.length > 0 ? biomarkers : [];

    markers.forEach((biomarker) => {
      const template = findTemplate(biomarker, topografia);

      // Score calculado por biomarcador: cada um tem a sua própria escala de resultados.
      const resultado = extractResultadoForBiomarker(
        text,
        biomarker,
        dbBiomarkers
      );

      const mergedParsed = {
        ...baseParsed,
        Resultado: resultado ?? null,
      };

      const parsedWithDbParams = params.reduce(
        (acc, p) => {
          const key = p.param_key || p.key;

          if (!key) return acc;

          acc[key] = mergedParsed[key] ?? null;

          return acc;
        },
        { ...context }
      );

      const missingFields = getMissingFields(parsedWithDbParams);

      parsedPages.push({
        caseIndex: index + 1,
        rawText: text,
        diagnosisNumber,

        patientName: getPatientName(index),

        parsed: {
          ...parsedWithDbParams,

          Topografia: template?.topografia || topografia,

          Plataforma: template?.plataforma || null,

          Anticorpo: template?.anticorpo || template?.anticorpoClone || null,
        },

        missingFields,
        hasIssues: missingFields.length > 0,

        biomarker,
        biomarkers: [biomarker],

        matchedTemplates,
        debug: {
          fuzzyParsed,
          contextualParsed,
          clinicalParsed,
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return { parsedPages, totalCases: cases.length };
}
