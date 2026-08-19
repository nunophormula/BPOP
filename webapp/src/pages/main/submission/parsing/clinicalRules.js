// Regras auxiliares aplicadas ao texto de um caso/linha, complementando o
// motor de contexto (paramMatching.js): correspondência direta de valores
// contra a base de parâmetros e um pequeno conjunto de padrões clínicos
// fixos (ex.: intensidade de expressão).
import { normalizeText, escapeRegex } from "./textUtils";

// Match direto (regex de palavra inteira) dos valores/sinónimos/keywords de cada parâmetro da BD.
export function extractFromDatabase(text, params) {
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
}

// Padrões clínicos fixos (intensidade); "Resultado" fica de fora — vem do biomarcador via biomarkerDetection.js.
export function applyClinicalRules(text) {
  const results = {};

  if (!text) return results;

  const clean = normalizeText(text);

  if (/tenue|ténue|fraca/.test(clean))
    results["Intensidade da expressão"] = "Fraca";

  if (/moderada/.test(clean))
    results["Intensidade da expressão"] = "Moderada";

  if (/forte/.test(clean)) results["Intensidade da expressão"] = "Forte";

  return results;
}

// Combina as duas regras acima num único resultado.
export function parseClinicalText(text, params) {
  return {
    ...extractFromDatabase(text, params),
    ...applyClinicalRules(text),
  };
}
