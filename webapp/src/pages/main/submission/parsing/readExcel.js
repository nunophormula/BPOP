// Devolve só dados estruturados — decisões de UI ficam no componente que chama isto.
import axios from "axios";
import endpoints from "../../../../utils/endpoints";
import { DIAGNOSIS_REGEX } from "./pdfReader";
import {
  extractParamFromCase,
  parseWithContext,
  parsePdfWithSimilarity,
} from "./paramMatching";
import { parseClinicalText } from "./clinicalRules";
import { detectBiomarkers, extractResultadoForBiomarker } from "./biomarkerDetection";
import { getMissingFields } from "./submissionRow";
import { getPatientName } from "./patientNames";

// Envia o Excel para o servidor (só parsing estrutural) e corre o motor de deteção sobre o texto de cada linha.
export async function readExcelFile(
  file,
  technicalContextValues,
  { params, dbBiomarkers, findTemplate, onUploadProgress, onProgress }
) {
  onProgress?.({ processed: 0, total: 0, text: "A carregar ficheiro..." });

  const formData = new FormData();

  formData.append("excel", file);
  formData.append("technical_context", JSON.stringify(technicalContextValues));

  const res = await axios.post(endpoints.submissionHer.readExcel, formData, {
    onUploadProgress: (event) => {
      if (!event.total) return;

      onUploadProgress?.(Math.round((event.loaded / event.total) * 100));
    },
  });

  const rawRows = res.data.sheets?.[0]?.rawRows || [];

  const selectedTopografia = technicalContextValues.topografia;

  const produtoParam = params.find((p) => p.param_key === "Produto");

  onProgress?.({
    processed: 0,
    total: rawRows.length,
    text: `${rawRows.length} linhas encontradas`,
  });

  const parsedRows = [];

  for (let index = 0; index < rawRows.length; index++) {
    const row = rawRows[index];

    onProgress?.({
      processed: index + 1,
      total: rawRows.length,
      text: `A analisar linha ${index + 1} de ${rawRows.length}`,
    });

    // Junta o texto da linha toda (ignora nomes de colunas, que variam por ficheiro) e trata como texto livre.
    const text = Object.values(row)
      .filter(
        (value) => value !== null && value !== undefined && String(value).trim()
      )
      .map((value) => String(value))
      .join("\n");

    const diagnosisMatch = text.match(DIAGNOSIS_REGEX);

    const diagnosisNumber = diagnosisMatch
      ? diagnosisMatch[0].replace(/\s+/g, "")
      : null;

    const biomarkers = detectBiomarkers(text, dbBiomarkers);

    const produto = extractParamFromCase(text, produtoParam);

    const fuzzyParsed = parsePdfWithSimilarity(text, params);
    const contextualParsed = parseWithContext(text, params);
    const clinicalParsed = parseClinicalText(text, params);

    const baseParsed = {
      ...fuzzyParsed,
      ...clinicalParsed,
      ...contextualParsed,

      Produto: produto ?? fuzzyParsed.Produto ?? null,
    };

    biomarkers.forEach((biomarker) => {
      const template = findTemplate(biomarker, selectedTopografia);

      // Score calculado por biomarcador: cada um tem a sua própria escala de resultados.
      const resultado = extractResultadoForBiomarker(text, biomarker, dbBiomarkers);

      const mergedParsed = {
        ...baseParsed,
        Resultado: resultado ?? null,
      };

      const parsedWithDbParams = params.reduce((acc, p) => {
        const key = p.param_key || p.key;

        if (!key) return acc;

        acc[key] = mergedParsed[key] ?? null;

        return acc;
      }, {});

      const missingFields = getMissingFields(parsedWithDbParams);

      parsedRows.push({
        rawText: text,
        diagnosisNumber,

        patientName: getPatientName(index),

        parsed: {
          ...parsedWithDbParams,

          Topografia: template?.topografia || selectedTopografia,

          Plataforma: template?.plataforma || null,

          Anticorpo: template?.anticorpo || template?.anticorpoClone || null,
        },

        missingFields,
        hasIssues: missingFields.length > 0,

        biomarker,
        biomarkers: [biomarker],
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return { parsedRows };
}
