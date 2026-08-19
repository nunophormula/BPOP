// Orquestra a leitura de um PDF: extrai o texto, separa por diagnóstico e
// aplica o motor de deteção/matching a cada caso. Devolve só os dados
// estruturados — decisões de UI (templates em falta, transições de passo,
// mensagens) ficam no componente que chama isto.
import { extractPdfPages, splitCasesByDiagnosis } from "./pdfReader";
import {
  extractParamFromCase,
  parseWithContext,
  parsePdfWithSimilarity,
} from "./paramMatching";
import { parseClinicalText } from "./clinicalRules";
import { detectBiomarkers, extractResultadoForBiomarker } from "./biomarkerDetection";
import { getMissingFields } from "./submissionRow";
import { getPatientName } from "./patientNames";

/**
 * @param {File} file
 * @param {object} options
 * @param {string} options.topografia - modelo tumoral selecionado
 * @param {Array} options.params - lista de parâmetros (Produto, Tumor primário, ...)
 * @param {Array} options.dbBiomarkers - biomarcadores + resultados vindos da BD
 * @param {(biomarcador: string, topografia: string) => object|undefined} options.findTemplate
 * @param {(update: {processed: number, total: number, text: string}) => void} [options.onProgress]
 */
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

    const fuzzyParsed = parsePdfWithSimilarity(text, params);
    const contextualParsed = parseWithContext(text, params);
    const clinicalParsed = parseClinicalText(text, params);

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

      // Cada biomarcador tem a sua própria escala de resultados
      // (biomarker_results), por isso o score tem de ser calculado por
      // biomarcador em vez de uma vez só para o caso inteiro.
      const resultado = extractResultadoForBiomarker(text, biomarker, dbBiomarkers);

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
