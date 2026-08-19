// Regras sobre o que torna uma linha de submissão (extraída de um PDF ou
// Excel) válida — usadas tanto pelos leitores como pela revisão/edição
// manual na tabela de resultados.

export function getMissingFields(parsed) {
  const missing = [];

  if (!parsed?.Produto) {
    missing.push("Produto");
  }

  if (!parsed?.Resultado) {
    missing.push("Resultado");
  }

  return missing;
}
