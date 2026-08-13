import { useState, useContext, useEffect, useMemo, useCallback } from "react";

// IMPORTS
import {
  Button,
  Form,
  Drawer,
  Upload,
  message,
  Select,
  Row,
  Col,
  Steps,
  Tag,
  Spin,
  Collapse,
  Modal,
  notification,
  Tabs,
  Table,
  Alert,
  Switch,
  Checkbox,
  Divider,
  Progress,
  Card,
} from "antd";

import stringSimilarity from "string-similarity";
import {
  PlusCircleOutlined,
  FileExcelOutlined,
  ArrowLeftOutlined,
  SaveOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  CheckCircleFilled,
  FilePdfOutlined,
  FilterOutlined,
} from "@ant-design/icons";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import defaultParams from "./params";

import { motion, AnimatePresence } from "framer-motion";

import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import endpoints from "../../../utils/endpoints";

import logoPDF from "../../../assets/pdf-bd.svg";
import logoCSV from "../../../assets/pdf-bd.svg";
import success from "../../../assets/Sucesso.svg";

import { Context } from "../../../utils/context";
import { useHospitalId, useHospitalBasePath } from "../../../utils/hospitalId";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const { Option } = Select;

function normalizeText(str) {
  return String(str ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Same cleanup as normalizeText, but keeps a 1:1 index map back to the
// original string so context windows can be sliced without drifting once
// whitespace runs are collapsed.
function normalizeTextWithMap(str) {
  const original = String(str ?? "");
  let expanded = "";
  const expandedMap = [];

  for (let i = 0; i < original.length; i++) {
    const cleaned = original[i]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^\w\s+]/g, " ");

    for (const ch of cleaned) {
      expanded += ch;
      expandedMap.push(i);
    }
  }

  let collapsed = "";
  const collapsedMap = [];
  let lastWasSpace = false;

  for (let i = 0; i < expanded.length; i++) {
    const ch = expanded[i];
    const isSpace = ch === " ";
    if (isSpace && lastWasSpace) continue;
    collapsed += ch;
    collapsedMap.push(expandedMap[i]);
    lastWasSpace = isSpace;
  }

  const firstNonSpace = collapsed.search(/\S/);
  const trailingSpace = collapsed.search(/\s+$/);
  const start = firstNonSpace === -1 ? 0 : firstNonSpace;
  const end = trailingSpace === -1 ? collapsed.length : trailingSpace;

  return {
    text: collapsed.slice(start, end),
    map: collapsedMap.slice(start, end),
  };
}

// Hospital "listagem de consulta" PDF exports rebuild each diagnosis note
// incrementally, reprinting the whole note from scratch every time a line is
// appended. Raw extraction therefore contains the same lines many times
// over. Since every earlier revision is a prefix (line-for-line) of a later
// one, keeping only the first occurrence of each line reconstructs the final,
// complete note while cutting the text (and downstream parsing work) down
// dramatically.
function dedupeRepeatedLines(text) {
  if (!text) return text;

  const seen = new Set();
  const kept = [];

  text.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      kept.push(rawLine);
      return;
    }

    if (seen.has(line)) return;

    seen.add(line);
    kept.push(rawLine);
  });

  return kept.join("\n");
}

function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function CreateExcel() {
  const [excelData, setExcelData] = useState([]);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [currentStep, setCurrentStep] = useState(0);
  const [lastSubmission, setLastSubmission] = useState(null);
  const [hospitalProcesses, setHospitalProcesses] = useState([]);
  const [technicalData, setTechnicalData] = useState(null);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [importType, setImportType] = useState(null);
  const [uploadStep, setUploadStep] = useState(0);
  const [totalDiagnosticosEncontrados, setTotalDiagnosticosEncontrados] =
    useState(0);
  const [selectedProcessNumber, setSelectedProcessNumber] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const [isParsing, setIsParsing] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdSubmissions, setCreatedSubmissions] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [dbBiomarkers, setDbBiomarkers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);

  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfProgressText, setPdfProgressText] = useState("");
  const [pdfTotalCases, setPdfTotalCases] = useState(0);
  const [pdfProcessedCases, setPdfProcessedCases] = useState(0);

  const [missingTemplates, setMissingTemplates] = useState([]);
  const [missingTemplateModal, setMissingTemplateModal] = useState(false);
  const [pendingApprovalTemplates, setPendingApprovalTemplates] = useState([]);
  const [pendingApprovalModal, setPendingApprovalModal] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [overrideExisting, setOverrideExisting] = useState(false);
  const { user } = useContext(Context);

  const [form] = Form.useForm();

  const [uploadForm] = Form.useForm();

  const hospitalId = useHospitalId();
  const basePath = useHospitalBasePath();
  const navigate = useNavigate();

  const DIAGNOSIS_REGEX =
    /\b(?:[HB]?\s*20\d{2}\/\d{3,}(?:-\d+)?|[HB]?\s*20\d{2}\d{3,}|\d{3,}\/[HB]?\s*20\d{2})\b/gi;

  const FUZZY_THRESHOLD = 0.6;

  async function fetchHospitalProcesses() {
    try {
      const res = await axios.get(
        endpoints.submissionHer.readProcessByHospital,
        {
          params: {
            hospital_id: hospitalId,
          },
        }
      );

      setHospitalProcesses(res.data.data || []);
    } catch (e) {
      console.log("erro");
      console.log(e);
    }
  }

  async function markExistingDiagnostics(rows) {
    // patient/diagnostic são pseudonimizados no servidor (tal como as
    // passwords), por isso a verificação de duplicados também tem de ser
    // feita lá — o browser já não consegue calcular o hash sozinho.
    try {
      // par diagnóstico+biomarcador: o mesmo nº de diagnóstico pode ter
      // submissões de biomarcadores diferentes, cada uma é uma duplicata
      // distinta (por isso não basta comparar só o nº de diagnóstico).
      const diagnosticPairs = [
        ...new Map(
          rows
            .filter((r) => r.diagnosisNumber && r.biomarker)
            .map((r) => [
              `${r.diagnosisNumber}|${r.biomarker}`,
              { diagnostic: r.diagnosisNumber, biomarcador: r.biomarker },
            ])
        ).values(),
      ];

      const patients = [
        ...new Set(rows.map((r) => getInitials(r.patientName)).filter(Boolean)),
      ];

      const res = await axios.post(endpoints.submissionHer.checkExisting, {
        hospital_id: hospitalId,
        diagnostics: diagnosticPairs,
        patients,
      });

      const existingIdByKey = new Map(
        (res.data?.existingDiagnostics || []).map((e) => [
          `${e.diagnostic}|${e.biomarcador}`,
          e.id,
        ])
      );
      const existingPatients = new Set(res.data?.existingPatients || []);

      setExcelData(
        rows.map((row) => {
          const existingSubmissionId = existingIdByKey.get(
            `${row.diagnosisNumber}|${row.biomarker}`
          );

          return {
            ...row,
            alreadyExists: !!existingSubmissionId,
            existingSubmissionId: existingSubmissionId || null,
            patientAlreadyExists: existingPatients.has(
              getInitials(row.patientName)
            ),
          };
        })
      );
    } catch (e) {
      console.log(e);
      setExcelData(rows);
    }
  }

  const validRows = useMemo(() => {
    return excelData.filter((row) => !row.missingFields?.length);
  }, [excelData]);

  function getMissingFields(parsed) {
    const missing = [];

    if (!parsed?.Produto) {
      missing.push("Produto");
    }

    if (!parsed?.Resultado) {
      missing.push("Resultado");
    }

    return missing;
  }

  function extractAfterParam(text, paramKey) {
    if (!text) return null;

    const cleanText = text;
    const cleanKey = paramKey;

    const index = cleanText.toLowerCase().indexOf(cleanKey.toLowerCase());

    if (index === -1) return null;

    // pega tudo à frente do param_key
    const after = cleanText.slice(index + cleanKey.length);

    const match = after.match(/[:\-–]?\s*([A-Za-zÀ-ÿ0-9\s\/()\-+]+)/);

    return match ? match[1].trim() : after.trim();
  }

  const renderStatsTab = (rows, technicalInfo) => {
    const stats = {
      products: {},
      results: {},
    };

    rows.forEach((item) => {
      const product = item.parsed?.Produto;
      const result = item.parsed?.Resultado;

      if (product) {
        stats.products[product] = (stats.products[product] || 0) + 1;
      }

      if (result) {
        stats.results[result] = (stats.results[result] || 0) + 1;
      }
    });
    return (
      <Row gutter={30}>
        <Col span={8}>
          <h3 className="font-semibold mb-6">Resultados</h3>

          <div className="space-y-5">
            {Object.entries(stats.results).map(([key, value]) => {
              let color = "#ff4d4f";

              if (key.includes("3+")) color = "#73d13d";
              else if (key.includes("2+")) color = "#faad14";

              return (
                <div key={key}>
                  <Tag color={color}>{key}</Tag>

                  <div className="flex items-center gap-3">
                    <Progress
                      percent={
                        rows.length
                          ? Math.round((value / rows.length) * 100)
                          : 0
                      }
                      showInfo={false}
                      strokeColor={color}
                    />

                    <span className="font-bold">{value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Col>

        <Col span={8}>
          <h3 className="font-semibold mb-6">Produtos</h3>

          <div className="space-y-4">
            {Object.entries(stats.products).map(([key, value]) => (
              <div
                key={key}
                className="bg-gray-50 px-5 py-4 rounded-lg flex justify-between"
              >
                <span className="font-semibold">{key}</span>

                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
        </Col>

        <Col span={8}>
          <h3 className="font-semibold mb-6">Contexto Técnico</h3>

          <div className="bg-gray-50 px-5 py-4 rounded-lg">
            <div className="mb-4">
              <div className="text-gray-400 text-sm">
                Plataforma:{" "}
                <span className="font-semibold text-black">
                  {technicalInfo?.plataforma || "-"}
                </span>
              </div>
            </div>

            <Divider />

            <div>
              <div className="text-gray-400 text-sm">
                Anticorpo:{" "}
                <span className="font-semibold text-black">
                  {technicalInfo?.anticorpo ||
                    technicalInfo?.anticorpoClone ||
                    "-"}
                </span>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    );
  };

  function getInitials(name = "") {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part.slice(0, 2))
      .join("")
      .toUpperCase();
  }

  function getPatientName(index) {
    return (
      patientNames[index] || `Doente ${String(index + 1).padStart(4, "0")}`
    );
  }

  async function fetchTechnical() {
    try {
      const res = await axios.get(
        `${endpoints.hospital.readTechnicalByHospital}?id=${hospitalId}`
      );

      const templates = res.data || [];

      if (!templates.length) return;

      setTemplates(
        (res.data || []).sort((a, b) => b.is_default - a.is_default)
      );
    } catch (e) {
      console.log(e);
    }
  }

  async function fetchBiomarkers() {
    try {
      const res = await axios.get(endpoints.biomarkers.read);

      setDbBiomarkers(res.data || []);
    } catch (e) {
      console.log(e);
    }
  }

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

  async function extractPdfPages(file) {
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

  const summaryStats = useMemo(() => {
    const rows = excelData || [];

    const products = {};
    const tumorPrimary = {};
    const results = {};

    let totalProducts = 0;

    rows.forEach((item) => {
      const p = item.parsed || {};

      // -------------------
      // PRODUTOS
      // -------------------
      const product = Array.isArray(p.Produto) ? p.Produto[0] : p.Produto;

      if (product) {
        totalProducts++;
        products[product] = (products[product] || 0) + 1;
      }

      // -------------------
      // TUMOR PRIMÁRIO
      // -------------------
      const tumor = Array.isArray(p["Tumor primário"])
        ? p["Tumor primário"][0]
        : p["Tumor primário"];

      if (tumor) {
        tumorPrimary[tumor] = (tumorPrimary[tumor] || 0) + 1;
      }

      // -------------------
      // RESULTADO
      // -------------------
      const result = Array.isArray(p.Resultado) ? p.Resultado[0] : p.Resultado;

      if (result) {
        results[result] = (results[result] || 0) + 1;
      }
    });

    return {
      totalProducts,
      products,
      tumorPrimary,
      results,
    };
  }, [excelData]);

  const invalidRows = useMemo(() => {
    return (excelData || []).filter((row) => row.missingFields?.length > 0);
  }, [excelData]);

  const existingRows = useMemo(() => {
    return (excelData || []).filter((row) => row.alreadyExists);
  }, [excelData]);

  const totalDiagnosticos = useMemo(
    () => new Set(excelData.map((r) => r.diagnosisNumber)).size,
    [excelData]
  );

  const diagnosticosValidos = new Set(
    excelData.filter((r) => !r.hasIssues).map((r) => r.diagnosisNumber)
  ).size;

  const diagnosticosInvalidos = useMemo(
    () => new Set(invalidRows.map((r) => r.diagnosisNumber)).size,
    [invalidRows]
  );

  const totalLinhas = useMemo(() => excelData.length, [excelData]);

  const totalSubmissoesValidas = useMemo(
    () =>
      excelData.filter(
        (r) => r.biomarker && r.parsed?.Produto && r.parsed?.Resultado
      ).length,
    [excelData]
  );

  const totalSubmissoesInvalidas = useMemo(
    () =>
      excelData.filter(
        (r) => !r.biomarker || !r.parsed?.Produto || !r.parsed?.Resultado
      ).length,
    [excelData]
  );

  async function processPdf() {
    try {
      setUploadStep(2);
      setIsParsing(true);

      if (!selectedFile) {
        message.error("Nenhum ficheiro selecionado");
        return;
      }

      const pages = await extractPdfPages(selectedFile);

      const fullText = pages.map((p) => p.text).join("\n");

      const cases = splitCasesByDiagnosis(fullText);
      setTotalDiagnosticosEncontrados(cases.length);

      setPdfProgressText(`${cases.length} diagnósticos encontrados`);

      // params uma vez só
      const produtoParam = params.find((p) => p.param_key === "Produto");

      console.log(`[PDF IMPORT] Encontrados ${cases.length} casos clínicos`);

      const selectedTopografia = uploadForm.getFieldValue("topografia");

      if (!selectedTopografia) {
        message.error("Seleciona o modelo tumoral");
        return;
      }
      const context = {
        Topografia: selectedTopografia,
      };

      setPdfTotalCases(cases.length);
      setPdfProcessedCases(0);

      const parsedPages = [];

      for (let index = 0; index < cases.length; index++) {
        const caseItem = cases[index];

        setPdfProcessedCases(index + 1);

        setPdfProgress(Math.round(((index + 1) / cases.length) * 100));

        setPdfProgressText(
          `A analisar diagnóstico ${index + 1} de ${cases.length}`
        );

        const text = caseItem.text || "";

        const biomarkers = detectBiomarkers(text);
        const selectedTopografia = uploadForm.getFieldValue("topografia");

        const matchedTemplates = biomarkers
          .map((biomarker) => findTemplate(biomarker, selectedTopografia))
          .filter(Boolean);

        setPdfProgressText(
          `Diagnóstico ${index + 1}/${cases.length} • ${
            biomarkers.join(", ") || "Sem biomarcador"
          }`
        );
        const diagnosisNumber = caseItem.diagnosisNumber;

        const produto = extractParamFromCase(text, produtoParam);

        const fuzzyParsed = parsePdfText(text);
        const contextualParsed = parseWithContext(text, params);
        const clinicalParsed = parseClinicalText(text);

        const baseParsed = {
          ...fuzzyParsed,
          ...clinicalParsed,
          ...contextualParsed,

          Produto: produto ?? fuzzyParsed.Produto ?? null,

          ...context,
        };

        const markers = biomarkers.length > 0 ? biomarkers : [];

        markers.forEach((biomarker) => {
          const template = findTemplate(biomarker, selectedTopografia);

          // Cada biomarcador tem a sua própria escala de resultados
          // (biomarker_results), por isso o score tem de ser calculado por
          // biomarcador em vez de uma vez só para o caso inteiro.
          const resultado = extractResultadoForBiomarker(text, biomarker);

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

              Topografia: template?.topografia || selectedTopografia,

              Plataforma: template?.plataforma || null,

              Anticorpo:
                template?.anticorpo || template?.anticorpoClone || null,
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
      await markExistingDiagnostics(parsedPages);

      console.log("CASES", cases.length);

      console.log("PARSED PAGES", parsedPages.length);

      console.log(
        "DIAGNOSTICOS UNICOS",
        new Set(parsedPages.map((x) => x.diagnosisNumber)).size
      );

      const biomarkersFound = new Set();

      parsedPages.forEach((item) => {
        (item.biomarkers || []).forEach((b) => {
          biomarkersFound.add(b);
        });
      });

      const missing = [];
      const pendingApproval = [];

      Array.from(biomarkersFound).forEach((biomarker) => {
        if (!biomarker) return;

        const template = findTemplate(biomarker, selectedTopografia);

        if (!template) {
          missing.push({
            biomarcador: biomarker,
            topografia: selectedTopografia,
            plataforma: null,
            anticorpo: null,
          });
        } else if (isTemplatePendingApproval(template)) {
          pendingApproval.push({
            biomarcador: biomarker,
            topografia: selectedTopografia,
            plataforma: template.plataforma,
            anticorpo: template.anticorpo,
          });
        }
      });

      if (missing.length) {
        setMissingTemplates(missing);
        setMissingTemplateModal(true);
        return;
      }

      if (pendingApproval.length) {
        setPendingApprovalTemplates(pendingApproval);
        setPendingApprovalModal(true);
        return;
      }

      setUploadSuccess(true);
      setUploadStep(3);

      setDrawerOpen(true);

      message.success("PDF processado!");
    } catch (err) {
      console.log(err);
      message.error("Erro ao processar PDF");
    } finally {
      setIsParsing(false);
    }
  }

  const biomarkersFound = useMemo(() => {
    const set = new Set();

    excelData.forEach((item) => {
      (item.biomarkers || []).forEach((b) => set.add(b));
    });

    return Array.from(set);
  }, [excelData]);

  const biomarkerTabs = biomarkersFound.map((marker) => {
    const template = templates.find((t) => t.biomarcador === marker);

    const customTemplate = missingTemplates.find(
      (t) => t.biomarcador === marker
    );

    const technicalInfo =
      templates.find((t) => t.biomarcador === marker) ||
      missingTemplates.find((t) => t.biomarcador === marker);

    const biomarkerRows = excelData.filter((row) =>
      row.biomarkers?.includes(marker)
    );

    return {
      key: marker,

      label: <span>{marker}</span>,
      children: <>{renderStatsTab(biomarkerRows, technicalInfo)}</>,
    };
  });

  function parsePdfText(text) {
    return parsePdfWithSimilarity(text, params);
  }

  function exportToExcel(data) {
    const rows = data.map((s) => ({
      "ID Interno": s.id,
      Doente: s.patient,
      Diagnóstico: s.diagnosisNumber,
      "Diagnóstico Encriptado": s.diagnostic,
      Biomarcador: s.biomarker,
      Produto: s.product,
      Resultado: s.result,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Submissões");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(blob, "submissoes_her2.xlsx");
  }

  function matchValue(text, values = []) {
    if (!text || !values.length) return null;

    const clean = normalizeText(text);

    let best = {
      value: null,
      score: 0,
    };

    for (const v of values) {
      const terms = [v.value, ...(v.keywords || [])]
        .filter(Boolean)
        .map(normalizeText);

      for (const term of terms) {
        // MATCH DIRETO
        if (clean.includes(term)) {
          return v.value;
        }

        // FUZZY EM JANELAS
        const words = clean.split(" ");

        const termLength = term.split(" ").length;

        for (let i = 0; i < words.length; i++) {
          const chunk = words.slice(i, i + termLength + 3).join(" ");

          const score = stringSimilarity.compareTwoStrings(chunk, term);

          if (score > best.score) {
            best = {
              value: v.value,
              score,
            };
          }
        }
      }
    }

    return best.score >= FUZZY_THRESHOLD ? best.value : null;
  }

  function bestFuzzyMatch(text, options) {
    if (!text || !options?.length) return null;

    const cleanText = normalizeText(text);

    let best = {
      value: null,
      score: 0,
    };

    for (const opt of options) {
      const allTerms = [opt.value, ...(opt.keywords || [])].map(normalizeText);

      for (const term of allTerms) {
        const score = stringSimilarity.compareTwoStrings(cleanText, term);

        if (score > best.score) {
          best = {
            value: opt.value,
            score,
          };
        }
      }
    }

    return best.score >= FUZZY_THRESHOLD ? best.value : null;
  }

  function matchParam(text, param) {
    if (!text || !param) return null;

    const clean = normalizeText(text);
    for (const kw of param.keywords || []) {
      if (clean.includes(normalizeText(kw))) {
        return kw;
      }
    }

    if (param.values?.length) {
      const best = bestFuzzyMatch(text, param.values);
      if (best) return best;
    }

    const paramScore = stringSimilarity.compareTwoStrings(
      clean,
      normalizeText(param.param_key)
    );

    if (paramScore >= FUZZY_THRESHOLD) {
      return param.param_key;
    }

    return null;
  }

  function findNextParamIndex(text, params) {
    const lower = text.toLowerCase();

    let minIndex = -1;

    for (const p of params) {
      const key = normalizeText(p.param_key || p.key);
      const idx = lower.indexOf(key);

      if (idx !== -1) {
        if (minIndex === -1 || idx < minIndex) {
          minIndex = idx;
        }
      }
    }

    return minIndex;
  }

  function extractParamFromCase(text, param) {
    if (!text || !param) return null;

    // 1. tentar contexto direto (KEYWORD → CONTEXTO)
    const contexts = getKeywordContexts(text, param.keywords, 80, 200);

    for (const context of contexts) {
      const match = matchValue(context, param.values);
      if (match) return match;
    }

    // 2. fallback: match global no bloco
    const fallback = matchValue(text, param.values);
    if (fallback) return fallback;

    return null;
  }

  function parseWithContext(text, params) {
    const result = {};

    if (!text || !params?.length) return result;

    const normalizedText = normalizeText(text);

    for (const param of params) {
      const key = param.param_key || param.key;

      if (!key) continue;

      if (key === "Resultado") {
        const contexts = getKeywordContexts(text, param.keywords, 100, 300);

        for (const context of contexts) {
          const matchedValue = matchValue(context, param.values);

          if (matchedValue) {
            result[key] = matchedValue;

            break;
          }
        }

        continue;
      }

      const allParamTerms = [key, ...(param.keywords || [])]
        .filter(Boolean)
        .map(normalizeText);

      let matchedKeyword = null;
      let matchedIndex = -1;

      for (const term of allParamTerms) {
        const idx = normalizedText.indexOf(term);

        if (idx !== -1) {
          matchedKeyword = term;
          matchedIndex = idx;
          break;
        }
      }

      if (!matchedKeyword) continue;

      const originalSlice = text.slice(matchedIndex);

      const nextKeyIndex = findNextParamIndex(
        normalizeText(originalSlice.slice(matchedKeyword.length)),
        params
      );

      const context =
        nextKeyIndex !== -1
          ? originalSlice.slice(
              matchedKeyword.length,
              matchedKeyword.length + nextKeyIndex
            )
          : originalSlice.slice(matchedKeyword.length);

      const matchedValue = matchValue(context, param.values);

      if (matchedValue) {
        result[key] = matchedValue;

        continue;
      }

      const fallback = matchValue(text, param.values);

      if (fallback) {
        result[key] = fallback;

        continue;
      }
    }

    return result;
  }

  function getKeywordContexts(text, keywords, before = 100, after = 300) {
    if (!text || !keywords?.length) return [];

    const contexts = [];

    const { text: cleanText, map } = normalizeTextWithMap(text);

    keywords.forEach((kw) => {
      const cleanKw = normalizeText(kw);

      let start = 0;

      while (true) {
        const idx = cleanText.indexOf(cleanKw, start);

        if (idx === -1) break;

        const originalIdx = map[idx] ?? 0;

        contexts.push(
          text.slice(
            Math.max(0, originalIdx - before),
            Math.min(text.length, originalIdx + after)
          )
        );

        start = idx + cleanKw.length;
      }
    });

    return contexts;
  }

  useEffect(() => {
    fetchTechnical();
    fetchHospitalProcesses();
    fetchBiomarkers();
  }, []);

  const params = useMemo(() => {
    const map = new Map();

    defaultParams.forEach((p) => {
      const key = normalizeText(p.param_key || p.key);

      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          ...p,
          param_key: p.param_key || p.key,
          required: false,
        });
      } else {
        const existing = map.get(key);

        const merged = [...(existing.values || []), ...(p.values || [])];

        const unique = merged.filter(
          (v, i, arr) => arr.findIndex((x) => x.value === v.value) === i
        );

        map.set(key, {
          ...existing,
          ...p,
          required: false,
          values: unique,
        });
      }
    });

    return Array.from(map.values());
  }, []);

  const paramsMap = useMemo(() => {
    const map = new Map();

    params.forEach((p) => map.set(normalizeText(p.param_key || p.key), p));

    return map;
  }, [params]);

  const extractFromDatabase = useCallback(
    (text) => {
      const results = {};

      if (!text) return results;

      const clean = normalizeText(text);

      params.forEach((param) => {
        param.values?.forEach((v) => {
          const terms = [
            normalizeText(v.value),
            ...(v.synonyms || []).map(normalizeText),
            ...(v.keywords || []).map(normalizeText),
          ];

          for (const term of terms) {
            const regex = new RegExp(`\\b${escapeRegex(term)}\\b`, "i");

            if (regex.test(clean)) {
              results[param.param_key] = v.value;

              break;
            }
          }
        });
      });

      return results;
    },
    [params]
  );

  const applyClinicalRules = useCallback((text) => {
    const results = {};

    if (!text) return results;

    const clean = normalizeText(text);

    // "Resultado" não é definido aqui — vem exclusivamente do
    // biomarker_results de cada biomarcador detetado (ver
    // extractResultadoForBiomarker), não de regras genéricas fixas no código.

    if (/tenue|ténue|fraca/.test(clean))
      results["Intensidade da expressão"] = "Fraca";

    if (/moderada/.test(clean))
      results["Intensidade da expressão"] = "Moderada";

    if (/forte/.test(clean)) results["Intensidade da expressão"] = "Forte";

    return results;
  }, []);

  const parseClinicalText = useCallback(
    (text) => ({
      ...extractFromDatabase(text),
      ...applyClinicalRules(text),
    }),
    [extractFromDatabase, applyClinicalRules]
  );

  async function processExcel(values) {
    try {
      setUploadStep(2);

      setIsParsing(true);

      setPdfTotalCases(0);
      setPdfProcessedCases(0);
      setPdfProgress(0);
      setPdfProgressText("A carregar ficheiro...");

      const formData = new FormData();

      formData.append("excel", selectedFile);

      formData.append("technical_context", JSON.stringify(values));

      const res = await axios.post(endpoints.submissionHer.readExcel, formData, {
        onUploadProgress: (event) => {
          if (!event.total) return;

          setPdfProgress(Math.round((event.loaded / event.total) * 100));
        },
      });

      const rawRows = res.data.sheets?.[0]?.rawRows || [];

      const selectedTopografia = values.topografia;

      const produtoParam = params.find((p) => p.param_key === "Produto");

      setPdfTotalCases(rawRows.length);
      setPdfProcessedCases(0);
      setPdfProgress(0);
      setPdfProgressText(`${rawRows.length} linhas encontradas`);

      const parsedRows = [];

      for (let index = 0; index < rawRows.length; index++) {
        const row = rawRows[index];

        setPdfProcessedCases(index + 1);

        setPdfProgress(
          rawRows.length
            ? Math.round(((index + 1) / rawRows.length) * 100)
            : 0
        );

        setPdfProgressText(
          `A analisar linha ${index + 1} de ${rawRows.length}`
        );

        // Ignora os nomes das colunas: junta todo o texto da linha e usa a
        // mesma deteção por texto livre do fluxo de PDF, já que o layout de
        // colunas varia de ficheiro para ficheiro.
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

        const biomarkers = detectBiomarkers(text);

        const produto = extractParamFromCase(text, produtoParam);

        const fuzzyParsed = parsePdfText(text);
        const contextualParsed = parseWithContext(text, params);
        const clinicalParsed = parseClinicalText(text);

        const baseParsed = {
          ...fuzzyParsed,
          ...clinicalParsed,
          ...contextualParsed,

          Produto: produto ?? fuzzyParsed.Produto ?? null,
        };

        biomarkers.forEach((biomarker) => {
          const template = findTemplate(biomarker, selectedTopografia);

          // Cada biomarcador tem a sua própria escala de resultados
          // (biomarker_results), por isso o score tem de ser calculado por
          // biomarcador em vez de uma vez só para a linha inteira.
          const resultado = extractResultadoForBiomarker(text, biomarker);

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

              Anticorpo:
                template?.anticorpo || template?.anticorpoClone || null,
            },

            missingFields,
            hasIssues: missingFields.length > 0,

            biomarker,
            biomarkers: [biomarker],
          });
        });

        await new Promise((resolve) => setTimeout(resolve, 0));
      }

      await markExistingDiagnostics(parsedRows);

      setUploadSuccess(true);

      setUploadStep(3);

      message.success("Parsing concluído!");
    } catch (err) {
      console.log(err);

      message.error("Erro ao processar Excel");
    } finally {
      setIsParsing(false);
    }
  }

  const filteredData = useMemo(() => {
    if (!showOnlyIssues) {
      return excelData;
    }

    return (excelData || []).filter((row) => row.hasIssues);
  }, [excelData, showOnlyIssues]);

  function resolveValue(value, options) {
    if (!value) return undefined;

    if (!options?.length) return value;

    const cleanValue = normalizeText(value);

    let match = options.find((opt) => normalizeText(opt) === cleanValue);

    if (!match) {
      match = options.find((opt) => {
        const cleanOpt = normalizeText(opt);

        return cleanOpt.includes(cleanValue) || cleanValue.includes(cleanOpt);
      });
    }

    return match || value;
  }

  async function submitForm() {
    try {
      // Rede de segurança final antes de submeter (cobre o fluxo de Excel,
      // que não passa pelo gate de processPdf, e qualquer alteração de
      // estado do template entre o parsing e este ponto).
      const blockedCombos = new Set();

      excelData.forEach((item) => {
        const row = item.parsed || {};
        const biomarker = item.biomarker;

        if (!biomarker) return;

        const template = findTemplate(
          biomarker,
          row.Topografia || selectedTemplate?.topografia
        );

        if (isTemplatePendingApproval(template)) {
          blockedCombos.add(`${biomarker} / ${template.topografia}`);
        }
      });

      if (blockedCombos.size) {
        message.error(
          `Não é possível submeter: ${[...blockedCombos].join(
            ", "
          )} usa(m) um template com plataforma e/ou anticorpo ainda por aprovar.`
        );
        return;
      }

      // patient/diagnostic seguem em claro para o servidor pseudonimizar
      // (mesmo princípio das passwords: o hash nunca é calculado no browser).
      // diagnosisNumber vai à parte, na mesma ordem, para depois recuperar o
      // valor original a apresentar ao utilizador sem depender do hash.
      const prepared = (
        await Promise.all(
          excelData.map(async (item) => {
            const row = item.parsed || {};

            const biomarker = item.biomarker;

            if (!row.Produto || !row.Resultado || !biomarker) {
              return null;
            }

            // Diagnósticos já existentes: ou substituem a submissão
            // encontrada (override), ou são ignorados por completo —
            // conforme a checkbox escolhida no modal de confirmação.
            if (item.alreadyExists && !overrideExisting) {
              return null;
            }

            // No ad-hoc fallback here on purpose: the missing-template modal
            // blocks the user before this step, so every biomarker/topografia
            // combination reaching submitForm must already resolve to a real
            // hospital_technical template.
            const technicalInfo = findTemplate(
              biomarker,
              row.Topografia || selectedTemplate?.topografia
            );

            return {
              diagnosisNumber: item.diagnosisNumber,
              submission: {
                // Nº processo = iniciais do nome do paciente, encriptadas no
                // servidor tal como o diagnóstico (nunca se guarda o nome).
                patient: getInitials(item.patientName),
                diagnostic: item.diagnosisNumber,

                hospital_id: Number(hospitalId),
                login_id: user.id,

                type: "PDF",
                biomarcador: biomarker,

                topografia:
                  technicalInfo?.topografia ||
                  row.Topografia ||
                  selectedTemplate?.topografia ||
                  null,

                plataforma:
                  technicalInfo?.plataforma ||
                  row.Plataforma ||
                  selectedTemplate?.plataforma ||
                  null,

                anticorpo:
                  technicalInfo?.anticorpo ||
                  technicalInfo?.anticorpoClone ||
                  row.Anticorpo ||
                  selectedTemplate?.anticorpoClone ||
                  null,

                plataforma_id: technicalInfo?.plataforma_id || null,
                anticorpo_id: technicalInfo?.anticorpo_id || null,
                technical_data: technicalInfo?.technical_data || null,

                produto: row.Produto,
                resultado: row.Resultado,

                ...(item.alreadyExists && overrideExisting
                  ? { override_id: item.existingSubmissionId }
                  : {}),
              },
            };
          })
        )
      ).filter(Boolean);

      const submissions = prepared.map((p) => p.submission);

      const payload = {
        submissions,
        process_mode: selectedProcessNumber ? "existing" : "new",
        patient: selectedProcessNumber || null,
      };

      console.log(submissions);

      const res = await axios.post(endpoints.submissionHer.create, payload);

      setCreatedSubmissions(
        res.data.submissions.map((item, index) => ({
          ...item,
          diagnosisNumber: prepared[index]?.diagnosisNumber || "-",
        }))
      );

      setProcessModalOpen(false);
      setSuccessModalOpen(true);
    } catch (e) {
      console.log(e);
      message.error("Erro ao guardar submissões");
    }
  }

  const statCard =
    "bg-white rounded-[10px] border !border-[#EEEEEE] shadow-[0px_10px_20px_#00000005] p-5 h-full flex flex-col justify-between";

  function getChunks(text, size = 12) {
    const words = normalizeText(text).split(" ");

    const chunks = [];

    for (let i = 0; i < words.length; i++) {
      chunks.push(words.slice(i, i + size).join(" "));
    }

    return chunks;
  }

  const biomarkerFilters = useMemo(() => {
    const set = new Set();

    excelData.forEach((row) => {
      (row.biomarkers || []).forEach((b) => {
        set.add(b);
      });
    });

    return Array.from(set).map((b) => ({
      text: b,
      value: b,
    }));
  }, [excelData]);

  function detectBiomarkers(text) {
    const clean = normalizeText(text);

    const found = [];

    dbBiomarkers.forEach((biomarker) => {
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
  function extractResultadoForBiomarker(text, biomarkerNome) {
    const biomarkerRecord = dbBiomarkers.find(
      (b) => normalizeText(b.nome) === normalizeText(biomarkerNome)
    );

    if (!biomarkerRecord?.resultados?.length) return null;

    return extractParamFromCase(text, {
      keywords: biomarkerRecord.keywords,
      values: biomarkerRecord.resultados,
    });
  }

  function buildStats(rows = []) {
    const products = {};
    const tumorPrimary = {};
    const results = {};

    rows.forEach((item) => {
      const p = item.parsed || {};

      const product = p.Produto;
      const result = p.Resultado;

      if (product) products[product] = (products[product] || 0) + 1;

      if (result) results[result] = (results[result] || 0) + 1;
    });

    return {
      total: rows.length,
      products,
      tumorPrimary,
      results,
    };
  }

  function recalculateRow(row) {
    const missingFields = getMissingFields(row.parsed);

    return {
      ...row,
      missingFields,
      hasIssues: missingFields.length > 0,
    };
  }

  function splitCasesByDiagnosis(fullText) {
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

  const detectImportType = (file) => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "pdf") {
      return "pdf";
    }

    if (["xls", "xlsx"].includes(extension)) {
      return "excel";
    }

    return null;
  };

  function findTemplate(biomarcador, topografia) {
    return templates.find(
      (t) =>
        normalizeText(t.biomarcador) === normalizeText(biomarcador) &&
        normalizeText(t.topografia) === normalizeText(topografia)
    );
  }

  // Mesma regra do hospital_technical/index.jsx: um template com plataforma
  // e/ou anticorpo ainda pendente (ou rejeitado) pode existir, mas não pode
  // ser usado para gerar submissões até ser aprovado pelo administrador.
  function isTemplatePendingApproval(template) {
    if (!template) return false;

    return (
      (template.plataforma_status && template.plataforma_status !== "approved") ||
      (template.anticorpo_status && template.anticorpo_status !== "approved")
    );
  }

  function parsePdfWithSimilarity(text, params) {
    const result = {};

    if (!text) return result;

    const chunks = getChunks(text);

    params.forEach((param) => {
      if (!param.values?.length) return;

      let best = {
        value: null,
        score: 0,
      };

      param.values.forEach((option) => {
        const terms = [option.value, ...(option.keywords || [])]
          .filter(Boolean)
          .map(normalizeText);

        terms.forEach((term) => {
          chunks.forEach((chunk) => {
            const score = stringSimilarity.compareTwoStrings(chunk, term);

            if (score > best.score) {
              best = {
                value: option.value,
                score,
              };
            }
          });
        });
      });

      if (best.score >= FUZZY_THRESHOLD) {
        result[param.param_key] = best.value;
      }
    });

    return result;
  }

  const patientNames = [
    "João Fonseca",
    "Ana Silva",
    "Pedro Santos",
    "Maria Ferreira",
    "Miguel Costa",
    "Rita Almeida",
    "Bruno Rocha",
    "Inês Pereira",
    "Tiago Martins",
    "Sofia Lopes",
    "André Carvalho",
    "Marta Correia",
    "Ricardo Gomes",
    "Carla Teixeira",
    "Luís Rodrigues",
    "Patrícia Oliveira",
    "Nuno Sousa",
    "Daniela Pinto",
    "Marco Ribeiro",
    "Sara Cardoso",
    "Vítor Cunha",
    "Catarina Melo",
    "Paulo Pires",
    "Helena Antunes",
    "Rui Barros",
    "Diana Neves",
    "Filipe Tavares",
    "Sónia Castro",
    "Gonçalo Moreira",
    "Andreia Faria",
    "José Mendes",
    "Cláudia Figueiredo",
    "Fernando Lopes",
    "Teresa Matos",
    "David Campos",
    "Mónica Freitas",
    "Adriano Sequeira",
    "Sandra Peixoto",
    "Hugo Fernandes",
    "Beatriz Coelho",
    "Afonso Magalhães",
    "Leonor Simões",
    "Tomás Batista",
    "Joana Rocha",
    "Eduardo Borges",
    "Isabel Monteiro",
    "Fábio Azevedo",
    "Raquel Cunha",
    "Diogo Machado",
    "Márcia Moura",
    "Alexandre Leite",
    "Filipa Duarte",
    "Samuel Martins",
    "Cristina Reis",
    "Rodrigo Esteves",
    "Vanessa Pacheco",
    "Sérgio Baptista",
    "Liliana Guedes",
    "Leandro Carvalho",
    "Margarida Lopes",
    "Tiago Nascimento",
    "Vera Ribeiro",
    "Nelson Teixeira",
    "Carolina Pinto",
    "Ruben Costa",
    "Tatiana Alves",
    "Gil Sousa",
    "Célia Correia",
    "Mateus Gomes",
    "Elsa Ferreira",
    "Artur Santos",
    "Bruna Oliveira",
    "Francisco Almeida",
    "Jéssica Martins",
    "Henrique Faria",
    "Iris Neves",
    "António Rocha",
    "Lúcia Tavares",
    "Rafael Barros",
    "Daniela Moura",
    "Rúben Cardoso",
    "Mafalda Castro",
    "Pedro Cunha",
    "Susana Moreira",
    "Jorge Mendes",
    "Dora Pires",
    "Victor Gomes",
    "Sílvia Lopes",
    "Tiago Seabra",
    "Patrícia Carvalho",
    "Afonso Ribeiro",
    "Anaísa Costa",
    "Gustavo Melo",
    "Mariana Borges",
    "Bruno Simões",
    "Vanessa Leite",
    "Diogo Duarte",
    "Cátia Ferreira",
    "Rui Tavares",
    "Helena Costa",
    "Luís Matos",
    "Andreia Ribeiro",
    "Ricardo Neves",
    "Sónia Santos",
    "Paulo Carvalho",
    "Mónica Almeida",
    "David Pacheco",
    "Joana Castro",
    "Filipe Moreira",
    "Sara Lopes",
    "Nélson Martins",
    "Beatriz Teixeira",
    "Gonçalo Cunha",
    "Cristina Duarte",
    "Tomás Costa",
    "Cláudia Ribeiro",
    "Rodrigo Sousa",
    "Liliana Ferreira",
  ];

  return (
    <div className="p-6 w-full">
      {uploadStep >= 0 && (
        <Steps
          current={uploadStep}
          className="custom-upload-steps !mx-auto max-w-[900px] mb-8"
          items={[
            { title: "Ficheiro" },
            { title: "Contexto Técnico" },
            { title: "Parsing" },
            { title: "Processado" },
            { title: "Revisão" },
          ]}
        />
      )}
      <div className="mt-4">
        {uploadStep >= 0 && uploadStep !== 4 && (
          <>
            <div className="flex items-stretch gap-2 align-middle items-center">
              <div className="flex-10/10 bg-gray-100 p-4 rounded mt-10">
                <p className="text-[#707070] text-center">Importação</p>

                <p className="text-black font-bold text-[23px] text-center mt-1">
                  {importType != "pdf" && importType != "excel"
                    ? "Via PDF/XLSX"
                    : ""}
                  {importType == "pdf" && "Via PDF"}
                  {importType == "excel" && "Via XLSX"}
                </p>

                <p className="text-[#707070] mt-1 text-sm text-center">
                  Permite importação um a um dos exames HER-2
                </p>

                <img
                  src={importType === "pdf" ? logoPDF : logoCSV}
                  className="max-w-[160px] mt-5 text-center mx-auto"
                />
              </div>

              <div className="flex-7/2 bg-gray-100 p-4 rounded min-h-[320px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`center-${uploadStep}`}
                    initial={{
                      opacity: 0,
                      y: 20,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -20,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                    className="h-full"
                  >
                    {uploadStep === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <Upload
                          beforeUpload={(file) => {
                            const detectedType = detectImportType(file);

                            if (!detectedType) {
                              message.error("Formato não suportado");
                              return Upload.LIST_IGNORE;
                            }

                            setImportType(detectedType);
                            setSelectedFile(file);
                            setUploadStep(1);

                            return false;
                          }}
                          showUploadList={false}
                          accept=".pdf,.xlsx,.xls,.doc,.docx"
                          className="btn-select-file"
                        >
                          <Button
                            type="primary"
                            size="large"
                            icon={<PlusCircleOutlined />}
                          >
                            Selecionar ficheiro
                          </Button>
                        </Upload>

                        <p className="text-gray-400 mt-4 text-sm">
                          Formatos suportados: .pdf / .xlsx / .xls
                        </p>
                      </div>
                    )}

                    {uploadStep === 1 && (
                      <div className="bg-white border rounded-[10px] border-[#EEEEEE] p-5">
                        <div className="bg-white rounded-xl border border-[#F5702B]! p-4 shadow-sm mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-[#FFF3E0] w-12 h-12 rounded-xl flex items-center justify-center">
                              {importType === "pdf" ? (
                                <FilePdfOutlined className="text-[#F5702B]! text-2xl" />
                              ) : (
                                <FileExcelOutlined className="text-[#F5702B]! text-2xl" />
                              )}
                            </div>

                            <div className="flex-1">
                              <p className="text-sm  text-gray-500">
                                Ficheiro selecionado
                              </p>

                              <p className="text-black font-semibold break-all">
                                {selectedFile?.name}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Form
                          form={uploadForm}
                          layout="vertical"
                          onFinish={(values) => {
                            if (importType === "pdf") {
                              processPdf();
                            } else {
                              processExcel(values);
                            }
                          }}
                          className="!mt-8"
                        >
                          <Form.Item
                            name="topografia"
                            label="Modelo Tumoral"
                            rules={[
                              {
                                required: true,
                                message: "Selecione o modelo tumoral",
                              },
                            ]}
                          >
                            <Select
                              placeholder="Selecionar modelo tumoral"
                              options={[
                                { label: "Mama", value: "Mama" },
                                { label: "Estômago", value: "Estômago" },
                                { label: "Gânglio", value: "Gânglio" },
                                {
                                  label: "Cólon e recto",
                                  value: "Cólon e recto",
                                },
                                { label: "Endométrio", value: "Endométrio" },
                                { label: "Ovário", value: "Ovário" },
                              ]}
                            />
                          </Form.Item>
                          {/* {selectedTemplate && (
                            <div className="mt-8 p-4 bg-[#EEEEEE] border border-[#EEEEEE] rounded-xl">
                              <div className="flex justify-between">
                                <strong className="text-gray-500">
                                  Modelo Tumoral:
                                </strong>{" "}
                                <strong className="text-right">
                                  {selectedTemplate.topografia || "-"}
                                </strong>
                              </div>
                              <Divider style={{ marginTop: "15px" }} />

                              <div className="flex justify-between">
                                <strong className="text-gray-500">
                                  Plataforma:
                                </strong>{" "}
                                <strong className="text-right">
                                  {selectedTemplate.plataforma || "-"}
                                </strong>
                              </div>
                              <Divider style={{ marginTop: "15px" }} />

                              <div className="flex justify-between">
                                <strong className="text-gray-500">
                                  Anticorpo:
                                </strong>{" "}
                                <strong className="text-right">
                                  {selectedTemplate.anticorpoClone || "-"}
                                </strong>
                              </div>
                            </div>
                          )} */}

                          <div className="flex justify-end gap-2 mt-6 items-center">
                            <Button
                              icon={<ArrowLeftOutlined />}
                              type="alter"
                              className="!text-[#F5702B] border !border-[#F5702B] !bg-transparent !rounded-[29px] !h-[40px] hover:!bg-[#F5702B] hover:!text-[#fff]"
                              onClick={() => setUploadStep(0)}
                            >
                              Voltar
                            </Button>

                            <Button
                              type="primary"
                              htmlType="submit"
                              className="!bg-[#F5702B] !rounded-[29px] !h-[40px] hover:!bg-transparent hover:!text-[#F5702B]"
                            >
                              Continuar
                            </Button>
                          </div>
                        </Form>
                      </div>
                    )}

                    {uploadStep === 2 && (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <Progress
                          type="circle"
                          percent={pdfProgress}
                          strokeColor="#F5702B"
                        />

                        <div className="text-xl font-semibold mt-6 mb-2">
                          A processar{" "}
                          {importType == "pdf" ? <>PDF</> : <>EXCEL</>}...
                        </div>

                        <div className="text-gray-500">{pdfProgressText}</div>

                        <div className="mt-4 text-sm text-gray-400">
                          {pdfProcessedCases} / {pdfTotalCases} diagnósticos
                          processados
                        </div>

                        <div className="text-gray-500">
                          Parsing clínico e normalização de parâmetros
                        </div>
                      </div>
                    )}

                    {uploadStep === 3 && (
                      <div>
                        <div className="bg-white rounded-xl border border-[#F5702B]! p-4 shadow-sm mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-[#FFF3E0] w-12 h-12 rounded-xl flex items-center justify-center">
                              {importType === "pdf" ? (
                                <FilePdfOutlined className="text-[#F5702B]! text-2xl" />
                              ) : (
                                <FileExcelOutlined className="text-[#F5702B]! text-2xl" />
                              )}
                            </div>

                            <div className="flex-1">
                              <p className="text-sm  text-gray-500">
                                Ficheiro selecionado
                              </p>

                              <p className="text-black font-semibold break-all">
                                {selectedFile?.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex-5/4 bg-gray-100 p-1 rounded min-h-[320px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`right-${uploadStep}`}
                    initial={{
                      opacity: 0,
                      x: 20,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x: -20,
                    }}
                    transition={{
                      duration: 0.25,
                    }}
                    className="h-full"
                  >
                    {uploadStep === 0 && (
                      <div className="h-full flex items-center justify-center text-gray-400">
                        Aguarda seleção de ficheiro
                      </div>
                    )}

                    {uploadStep === 1 && (
                      <div className="h-full flex flex-col justify-center px-1 mt-2">
                        <div className="flex-1 flex items-center justify-center text-center mb-4">
                          <div className="max-w-sm">
                            <div className="text-2xl font-semibold text-black mb-3">
                              Contexto técnico
                            </div>

                            <p className="text-gray-500 leading-relaxed">
                              Seleciona o modelo tumoral, plataforma e
                              anticorpo antes do parsing do Excel.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {uploadStep === 3 && (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="rounded-2xl p-8 w-full">
                          <div className="flex justify-center items-center mb-4">
                            <img src={success} className="w-[90px]" />
                          </div>

                          <h3 className="text-black font-bold text-xl">
                            {importType === "pdf"
                              ? "PDF processado com sucesso!"
                              : "Excel processado com sucesso!"}
                          </h3>

                          <p className="text-gray-500 mt-3">
                            Reveja os diagnósticos antes de guardar.
                          </p>

                          <div className="mt-6 flex flex-col items-center">
                            <Tag
                              color="success"
                              size="large"
                              className="px-4 py-1 text-lg"
                            >
                              {excelData.length}{" "}
                              {excelData.length == 1
                                ? "diagnóstico"
                                : "diagnósticos"}{" "}
                              {excelData.length == 1
                                ? "encontrado"
                                : "encontrados"}
                            </Tag>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            {uploadStep === 3 && (
              <div className="w-full flex justify-center mt-8">
                <div className="btn-select-file">
                  <Button
                    type="primary"
                    size="large"
                    className="px-8"
                    icon={<EyeOutlined />}
                    onClick={() => setDrawerOpen(true)}
                  >
                    Rever dados submetidos
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {uploadStep === 4 && (
          <div className="bg-gray-100 rounded-2xl mt-4 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-black">
                  Revisão dos diagnósticos
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Expande cada diagnóstico para rever os dados extraídos.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="alter"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setUploadStep(3)}
                >
                  Voltar
                </Button>
                <div className="btn-select-file">
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    size="large"
                    onClick={() => {
                      if (excelData.length === 1) {
                        setProcessModalOpen(true);
                      } else {
                        form.submit();
                      }
                    }}
                  >
                    Guardar {excelData.length == 1 ? "submissão" : "submissões"}
                  </Button>
                </div>
              </div>
            </div>

            <Row gutter={16} className="mb-6">
              <Col xs={24} md={8}>
                <div className="bg-white rounded-xl border p-4 shadow-sm h-full">
                  <h3 className="font-semibold text-black mb-2 text-[18px]">
                    Produtos
                  </h3>
                  <div className="space-y-1 text-sm">
                    {Object.entries(summaryStats.products)
                      .slice(0, 3)
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-gray-600 truncate">{k}</span>
                          <span className="font-medium">{v}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </Col>{" "}
              <Col xs={24} md={8}>
                <div className="bg-white rounded-xl border p-4 shadow-sm h-full">
                  <h3 className="font-semibold text-black mb-2 text-[18px]">
                    Tumor primário
                  </h3>

                  <div className="space-y-2 text-sm">
                    {Object.entries(summaryStats.tumorPrimary)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 4)
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-gray-600 truncate">{k}</span>
                          <span className="font-medium">{v}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </Col>{" "}
              <Col xs={24} md={8}>
                <div className="bg-white rounded-xl border p-4 shadow-sm h-full">
                  <h3 className="font-semibold text-black mb-2 text-[18px]">
                    Resultados
                  </h3>

                  <div className="space-y-2 text-sm">
                    {Object.entries(summaryStats.results)
                      .sort((a, b) => b[1] - a[1])
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-gray-600">{k}</span>
                          <span className="font-medium">{v}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </Col>
            </Row>

            <Form
              form={form}
              layout="vertical"
              onFinish={submitForm}
              onValuesChange={() => {
                setExcelData((prev) => [...prev]);
              }}
            >
              <Collapse
                accordion
                className="bg-white rounded-xl overflow-hidden"
                items={excelData.map((item, index) => {
                  const parsed = item.parsed || {};

                  return {
                    key: index,

                    label: (
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="font-semibold">
                          Diagnóstico {index + 1}
                        </div>
                        {(() => {
                          const emptyFields = Object.keys(parsed).filter(
                            (fieldKey) => {
                              const currentValue = form.getFieldValue([
                                index,
                                fieldKey,
                              ]);

                              // ARRAY (tags)
                              if (Array.isArray(currentValue)) {
                                return (
                                  currentValue.length === 0 ||
                                  currentValue.every(
                                    (v) =>
                                      v === undefined ||
                                      v === null ||
                                      String(v).trim() === ""
                                  )
                                );
                              }

                              // NORMAL VALUE
                              return (
                                currentValue === undefined ||
                                currentValue === null ||
                                String(currentValue).trim() === ""
                              );
                            }
                          );
                          if (emptyFields.length > 0) {
                            return (
                              <div className="flex items-center gap-2 text-yellow-600 font-medium">
                                <ExclamationCircleOutlined />

                                <span>
                                  Valor
                                  {emptyFields.length > 1 ? "es" : ""} em falta
                                </span>
                              </div>
                            );
                          }

                          return (
                            <>
                              <div className="text-green-600 gap-2 flex font-medium">
                                <CheckCircleOutlined />
                                Completo
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ),

                    children: (
                      <Row gutter={[16, 16]}>
                        {Object.entries(parsed).map(([key, value]) => {
                          const param = paramsMap.get(normalizeText(key));

                          const options =
                            param?.values?.map((v) => v.value) || [];

                          const matchedValue = resolveValue(value, options);

                          return (
                            <Col xs={24} md={12} lg={8} key={key}>
                              <Form.Item
                                label={<span>{key}</span>}
                                name={[index, key]}
                                initialValue={matchedValue}
                                rules={[]}
                              >
                                <Select
                                  style={{
                                    width: "100%",
                                  }}
                                  showSearch
                                  // allowClear={!param?.required}
                                  mode="tags"
                                  placeholder={
                                    param?.required
                                      ? "Campo obrigatório"
                                      : "Escolha ou escreva"
                                  }
                                >
                                  {[...options]
                                    .filter(Boolean)
                                    .filter((v, i, arr) => arr.indexOf(v) === i)
                                    .map((v) => (
                                      <Option key={v} value={v}>
                                        {v}
                                      </Option>
                                    ))}
                                </Select>
                              </Form.Item>
                            </Col>
                          );
                        })}
                      </Row>
                    ),
                  };
                })}
              />
            </Form>
          </div>
        )}
      </div>
      <Modal
        open={successModalOpen}
        onCancel={() => setSuccessModalOpen(false)}
        footer={null}
        centered
        width={450}
      >
        <div className="flex flex-col items-center text-center py-6">
          <CheckCircleFilled style={{ fontSize: 64, color: "#a6e7be" }} />

          <h2 className="text-xl font-semibold mt-4">
            Diagnósticos submetidos com sucesso
          </h2>

          <p className="text-gray-500 mt-2">
            Foram criadas <strong>{createdSubmissions.length}</strong>{" "}
            submissões com os respetivos números de processo.
          </p>

          <Button
            type="primary"
            size="large"
            className="mt-6 px-8"
            onClick={() => exportToExcel(createdSubmissions)}
          >
            Descarregar Excel
          </Button>
          <Link to={`${basePath}/process`}>
            <Button
              type="alter"
              size="small"
              className="mt-4 !text-[14px] px-8 underline"
              onClick={() => exportToExcel(createdSubmissions)}
            >
              Ir para submissões
            </Button>
          </Link>

          <p className="text-xs text-gray-400 mt-3">
            Descarregue o ficheiro com todos os IDs e processos.
          </p>
        </div>
      </Modal>
      <Modal
        open={processModalOpen}
        onCancel={() => setProcessModalOpen(false)}
        footer={null}
        centered
        width={560}
      >
        <div className="py-2">
          <div>
            <h2 className="text-2xl font-semibold text-black">
              Guardar submissão
            </h2>

            <p className="text-gray-500 mt-2 leading-relaxed">
              Escolha se pretende criar um novo processo ou associar esta
              submissão a um processo já existente.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-6">
            <div
              className={`
          border rounded-2xl p-4 cursor-pointer transition-all
          ${
            !selectedProcessNumber
              ? "border-[#d77600] bg-[#ffc47c69]"
              : "border-gray-200 hover:border-gray-300"
          }
        `}
              onClick={() => {
                setSelectedProcessNumber(null);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-[#d77600] mt-1 flex items-center justify-center">
                  {!selectedProcessNumber && (
                    <div className="w-2.5 h-2.5 bg-[#d77600] rounded-full" />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-black">
                    Criar novo processo
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Será criado automaticamente um novo número de processo para
                    esta submissão.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={`
          border rounded-2xl p-4 transition-all
          ${
            selectedProcessNumber
              ? "border-[#d77600] bg-[#ffc47c69]"
              : "border-gray-200"
          }
        `}
            >
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-[#d77600] mt-1 flex items-center justify-center">
                  {selectedProcessNumber && (
                    <div className="w-2.5 h-2.5 bg-[#d77600] rounded-full" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-black">
                    Associar a processo existente
                  </h3>

                  <p className="text-sm text-gray-500 mt-1 mb-4">
                    Selecione um processo já existente da instituição.
                  </p>

                  <Select
                    showSearch
                    size="large"
                    className="w-full"
                    placeholder="Selecionar processo"
                    value={selectedProcessNumber}
                    onChange={setSelectedProcessNumber}
                    optionFilterProp="children"
                  >
                    {hospitalProcesses.map((p) => (
                      <Option key={p.patient} value={p.patient}>
                        {p.patient}
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-8">
            <Button onClick={() => setProcessModalOpen(false)}>Cancelar</Button>

            <Button
              type="primary"
              onClick={() => {
                setProcessModalOpen(false);
                form.submit();
              }}
            >
              Guardar submissão
            </Button>
          </div>
        </div>
      </Modal>
      <Drawer
        title="Revisão dos dados extraídos"
        placement="right"
        width={1200}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => setSubmitModalOpen(true)}
            >
              Efetuar submissão
            </Button>
          </>
        }
      >
        {invalidRows.length > 0 && (
          <Alert
            showIcon
            type="warning"
            className="!mb-6"
            message={`${invalidRows.length} diagnósticos necessitam de validação manual para completar o processamento.`}
          />
        )}

        <Row gutter={16}>
          <Col span={8}>
            <div className={statCard}>
              <p className="text-center text-gray-500 mb-5">Registos</p>

              <div className="text-center">
                <h1 className="text-4xl font-bold text-slate-900">
                  {excelData.length}
                </h1>

                <p className="mt-4 text-gray-500">Total analisado</p>
              </div>
            </div>
          </Col>

          <Col span={8}>
            <div className={statCard}>
              <p className="text-center text-gray-500 mb-5">Qualidade</p>

              <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900">
                  {invalidRows.length === 0 ? "Sucesso" : "Parâmetros em falta"}
                </h2>

                <p className="mt-4 text-orange-600">
                  {invalidRows.length} diagnósticos com falhas
                </p>
              </div>
            </div>
          </Col>

          <Col span={8}>
            <div className={statCard}>
              <p className="text-center text-gray-500 mb-2">Taxa de sucesso</p>

              <h2 className="text-4xl text-center font-bold text-orange-500">
                {excelData.length
                  ? Math.round(
                      ((excelData.length - invalidRows.length) /
                        excelData.length) *
                        100
                    )
                  : 0}
                %
              </h2>

              <div className="text-center">
                <Progress
                  showInfo={false}
                  percent={
                    excelData.length
                      ? Math.round(
                          ((excelData.length - invalidRows.length) /
                            excelData.length) *
                            100
                        )
                      : 0
                  }
                  strokeColor="#eb7b3d"
                  className="mt-6"
                />
              </div>
            </div>
          </Col>
        </Row>

        <Row gutter={16} className="mt-6">
          <Col span={24}>
            <Card className="rounded-xl">
              <Tabs
                defaultActiveKey="all"
                tabBarExtraContent={{
                  right: <Button type="text" icon={<FilterOutlined />} />,
                }}
                items={[
                  {
                    key: "all",
                    label: "Tudo",
                    children: renderStatsTab(excelData),
                  },

                  ...biomarkerTabs,

                  {
                    key: "dados",
                    label: "Dados",
                    children: (
                      <>
                        <div className="mb-5">
                          <Switch
                            checked={showOnlyIssues}
                            onChange={setShowOnlyIssues}
                          />

                          <span className="ml-3">
                            Mostrar apenas diagnósticos incompletos
                          </span>
                        </div>

                        <Table
                          rowKey={(record, index) => index}
                          dataSource={filteredData}
                          pagination={{ pageSize: 10 }}
                          rowClassName={(record) => {
                            if (record.alreadyExists) {
                              return "bg-yellow-50";
                            }

                            if (record.hasIssues) {
                              return "bg-red-50";
                            }

                            return "";
                          }}
                          columns={[
                            {
                              title: "Estado",
                              render: (_, record) => {
                                if (record.alreadyExists) {
                                  return <Tag color="warning">Já existe</Tag>;
                                }

                                if (record.hasIssues) {
                                  return <Tag color="error">Incompleto</Tag>;
                                }

                                return <Tag color="success">Novo</Tag>;
                              },
                            },
                            {
                              title: "Diagnóstico",
                              dataIndex: "diagnosisNumber",
                              render: (v) => <b>{v || "-"}</b>,
                            },
                            {
                              title: "Doente",
                              render: (_, record) =>
                                record.patientAlreadyExists
                                  ? "Já existe"
                                  : "Novo",
                            },
                            {
                              title: "Biomarcador",
                              dataIndex: "biomarkers",

                              filters: biomarkerFilters,

                              onFilter: (value, record) =>
                                record.biomarkers?.includes(value),
                            },
                            {
                              title: "Produto",
                              render: (_, record, index) => (
                                <Select
                                  value={record.parsed?.Produto}
                                  placeholder="Produto"
                                  style={{ width: "100%" }}
                                  onChange={(value) => {
                                    setExcelData((prev) =>
                                      prev.map((row) => {
                                        if (row !== record) return row;

                                        const updatedRow = {
                                          ...row,
                                          parsed: {
                                            ...row.parsed,
                                            Produto: value,
                                          },
                                        };

                                        const missingFields = getMissingFields(
                                          updatedRow.parsed
                                        );

                                        return {
                                          ...updatedRow,
                                          missingFields,
                                          hasIssues: missingFields.length > 0,
                                        };
                                      })
                                    );
                                  }}
                                  options={[
                                    {
                                      label: "Biópsia",
                                      value: "Biópsia",
                                    },
                                    {
                                      label: "Peça cirúrgica",
                                      value: "Peça cirúrgica",
                                    },
                                  ]}
                                />
                              ),
                            },
                            {
                              title: "Resultado",
                              render: (_, record, index) => (
                                <Select
                                  value={record.parsed?.Resultado}
                                  style={{ width: "100%" }}
                                  onChange={(value) => {
                                    setExcelData((prev) =>
                                      prev.map((row) => {
                                        if (row !== record) return row;

                                        const updatedRow = {
                                          ...row,
                                          parsed: {
                                            ...row.parsed,
                                            Resultado: value,
                                          },
                                        };

                                        const missingFields = getMissingFields(
                                          updatedRow.parsed
                                        );

                                        return {
                                          ...updatedRow,
                                          missingFields,
                                          hasIssues: missingFields.length > 0,
                                        };
                                      })
                                    );
                                  }}
                                  options={[
                                    {
                                      label: "0",
                                      value: "0",
                                    },
                                    {
                                      label: "1+",
                                      value: "1+",
                                    },
                                    {
                                      label: "2+",
                                      value: "2+",
                                    },
                                    {
                                      label: "3+",
                                      value: "3+",
                                    },
                                  ]}
                                />
                              ),
                            },
                          ]}
                        />
                      </>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </Drawer>
      <Modal
        open={missingTemplateModal}
        width={550}
        title="Falta configurar um template"
        closable={false}
        footer={[
          <Button key="cancel" onClick={() => setMissingTemplateModal(false)}>
            Fechar
          </Button>,
          <Button
            key="create-template"
            type="primary"
            onClick={() => {
              setMissingTemplateModal(false);
              navigate(`${basePath}/technical/create`);
            }}
          >
            Configurar template
          </Button>,
        ]}
      >
        <Alert
          showIcon
          type="warning"
          className="mb-4"
          message={
            missingTemplates.length > 1
              ? "Não foram encontrados templates para as seguintes combinações"
              : "Não foi encontrado template para a seguinte combinação"
          }
          description="É necessário configurar um template técnico (plataforma e anticorpo) para o biomarcador e modelo tumoral selecionados antes de continuar."
        />

        <div className="flex flex-col gap-2 mt-2">
          {missingTemplates
            .filter((template) => template?.biomarcador?.trim?.())
            .map((template) => (
              <div
                key={template.biomarcador}
                className="border border-[#EEEEEE] rounded-[8px] px-4 py-2 flex justify-between items-center"
              >
                <span className="font-medium">{template.biomarcador}</span>
                <span className="text-gray-500">{template.topografia}</span>
              </div>
            ))}
        </div>
      </Modal>
      <Modal
        open={pendingApprovalModal}
        width={550}
        title="Template por aprovar"
        closable={false}
        footer={[
          <Button key="cancel" onClick={() => setPendingApprovalModal(false)}>
            Fechar
          </Button>,
          <Button
            key="view-templates"
            type="primary"
            onClick={() => {
              setPendingApprovalModal(false);
              navigate(`${basePath}/technical`);
            }}
          >
            Ver templates
          </Button>,
        ]}
      >
        <Alert
          showIcon
          type="warning"
          className="mb-4"
          message={
            pendingApprovalTemplates.length > 1
              ? "As seguintes combinações usam templates ainda por aprovar"
              : "A seguinte combinação usa um template ainda por aprovar"
          }
          description="A plataforma e/ou o anticorpo do template estão pendentes de aprovação do administrador (ou foram rejeitados). Não é possível submeter dados enquanto não forem aprovados."
        />

        <div className="flex flex-col gap-2 mt-2">
          {pendingApprovalTemplates
            .filter((template) => template?.biomarcador?.trim?.())
            .map((template) => (
              <div
                key={template.biomarcador}
                className="border border-[#EEEEEE] rounded-[8px] px-4 py-2 flex justify-between items-center"
              >
                <span className="font-medium">{template.biomarcador}</span>
                <span className="text-gray-500">{template.topografia}</span>
              </div>
            ))}
        </div>
      </Modal>
      <Modal
        open={submitModalOpen}
        onCancel={() => setSubmitModalOpen(false)}
        centered
        title="Confirmar submissão"
        footer={[
          <Button key="cancel" onClick={() => setSubmitModalOpen(false)}>
            Cancelar
          </Button>,

          <Button
            key="confirm"
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => {
              setSubmitModalOpen(false);
              submitForm();
            }}
          >
            Confirmar submissão
          </Button>,
        ]}
      >
        <div className="space-y-4">
          <Alert showIcon type="info" message="Resumo do processamento" />

          <div className="mt-4">
            <p>
              Foram encontrados <strong>{totalDiagnosticosEncontrados}</strong>{" "}
              diagnósticos no ficheiro.
            </p>

            <p>
              Foram gerados <strong>{excelData.length}</strong> registos para
              análise.
            </p>
          </div>

          <Divider style={{ margin: "10px 0" }} />

          <div className="mt-4">
            <p>
              Registos completos:
              <strong className="text-green-600"> {validRows.length}</strong>
            </p>

            <p>
              Registos com problemas:
              <strong className="text-red-600"> {invalidRows.length}</strong>
            </p>
          </div>

          {invalidRows.length > 0 && (
            <Alert
              showIcon
              type="warning"
              message={`${invalidRows.length} registos serão ignorados porque têm campos obrigatórios em falta.`}
            />
          )}

          {existingRows.length > 0 && (
            <>
              <Divider style={{ margin: "10px 0" }} />

              <Alert
                showIcon
                type="warning"
                message={`${existingRows.length} diagnósticos já existem nesta instituição.`}
              />

              <Checkbox
                className="!mt-2"
                checked={overrideExisting}
                onChange={(e) => setOverrideExisting(e.target.checked)}
              >
                Substituir os diagnósticos já existentes com os novos dados
              </Checkbox>

              <p className="text-gray-500 text-sm !mt-1">
                {overrideExisting
                  ? "As submissões já existentes serão atualizadas com os dados deste ficheiro."
                  : "Os diagnósticos já existentes serão ignorados e não voltam a ser guardados."}
              </p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
