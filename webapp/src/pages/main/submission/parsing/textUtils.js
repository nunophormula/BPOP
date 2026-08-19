// Utilitários de texto partilhados por todo o motor de parsing (PDF e Excel).

export function normalizeText(str) {
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
export function normalizeTextWithMap(str) {
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

// Estas listagens reimprimem a nota toda a cada linha nova, por isso o texto
// vem com as mesmas linhas repetidas várias vezes. Como cada versão é sempre
// um prefixo da seguinte, guardar só a 1ª ocorrência de cada linha reconstrói a nota final.
export function dedupeRepeatedLines(text) {
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

export function escapeRegex(str = "") {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getChunks(text, size = 12) {
  const words = normalizeText(text).split(" ");

  const chunks = [];

  for (let i = 0; i < words.length; i++) {
    chunks.push(words.slice(i, i + size).join(" "));
  }

  return chunks;
}
