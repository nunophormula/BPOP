// Motor genérico de deteção de parâmetros clínicos (Produto, Tumor
// primário, Resultado, ...) a partir de texto livre, usando keywords +
// fuzzy matching contra os valores possíveis definidos em params.jsx (ou,
// no caso do Resultado por biomarcador, em biomarker_results).
import stringSimilarity from "string-similarity";
import { normalizeText, normalizeTextWithMap, getChunks } from "./textUtils";

const FUZZY_THRESHOLD = 0.6;

export function matchValue(text, values = []) {
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

export function bestFuzzyMatch(text, options) {
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

export function getKeywordContexts(text, keywords, before = 100, after = 300) {
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

export function extractParamFromCase(text, param) {
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

export function parseWithContext(text, params) {
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

export function parsePdfWithSimilarity(text, params) {
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
