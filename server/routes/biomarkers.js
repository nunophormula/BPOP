var express = require("express");
var router = express.Router();
var util = require("util");
var db = require("../utils/database");
const { requireRole } = require("../utils/authorize");
const { logEvent } = require("../utils/auditLog");

const query = util.promisify(db.query).bind(db);

function sanitizeKeywords(keywords) {
  if (!Array.isArray(keywords)) return [];

  return [
    ...new Set(
      keywords
        .map((k) => String(k ?? "").trim())
        .filter(Boolean)
    ),
  ];
}

function sanitizeResultados(resultados) {
  if (!Array.isArray(resultados)) return [];

  return resultados
    .map((r) => ({
      value: String(r?.value ?? "").trim(),
      keywords: sanitizeKeywords(r?.keywords),
    }))
    .filter((r) => r.value);
}

async function attachResultados(biomarkers) {
  if (!biomarkers.length) return biomarkers;

  const ids = biomarkers.map((b) => b.id);

  const resultados = await query(
    "SELECT id, biomarker_id, value, keywords FROM biomarker_results WHERE biomarker_id IN (?) ORDER BY id",
    [ids]
  );

  const byBiomarker = {};

  resultados.forEach((r) => {
    if (!byBiomarker[r.biomarker_id]) byBiomarker[r.biomarker_id] = [];

    byBiomarker[r.biomarker_id].push({
      id: r.id,
      value: r.value,
      keywords: JSON.parse(r.keywords || "[]"),
    });
  });

  return biomarkers.map((b) => ({
    ...b,
    keywords: JSON.parse(b.keywords || "[]"),
    resultados: byBiomarker[b.id] || [],
  }));
}

// listagem aberta a qualquer utilizador autenticado - usada também pelo
// parsing de submissões, não só pela gestão de dados.
router.get("/read", async (req, res) => {
  try {
    const rows = await query(`
      SELECT
        b.id,
        b.nome,
        b.keywords,
        b.admin_id,
        b.created_by,
        b.created_at,
        l.nome AS administrador,
        cb.nome AS criado_por,
        (
          SELECT COUNT(*)
          FROM hospital_technical ht
          WHERE ht.biomarcador = b.nome
        ) AS n_utilizacoes
      FROM biomarkers b
      LEFT JOIN login l ON l.id = b.admin_id
      LEFT JOIN login cb ON cb.id = b.created_by
      ORDER BY b.nome
    `);

    res.send(await attachResultados(rows));
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.post("/create", requireRole("admin"), async (req, res) => {
  const nome = req.body.nome?.trim();
  const keywords = sanitizeKeywords(req.body.keywords);
  const resultados = sanitizeResultados(req.body.resultados);

  if (!nome || !keywords.length) {
    return res.status(400).send({
      message: "Nome e pelo menos uma palavra-chave são obrigatórios",
    });
  }

  try {
    const existing = await query(
      "SELECT id FROM biomarkers WHERE LOWER(nome) = LOWER(?)",
      [nome]
    );

    if (existing.length) {
      return res
        .status(409)
        .send({ message: "Já existe um biomarcador com este nome." });
    }

    const result = await query("INSERT INTO biomarkers SET ?", {
      nome,
      keywords: JSON.stringify(keywords),
      admin_id: req.user.id,
      created_by: req.user.id,
    });

    for (const resultado of resultados) {
      await query("INSERT INTO biomarker_results SET ?", {
        biomarker_id: result.insertId,
        value: resultado.value,
        keywords: JSON.stringify(resultado.keywords),
      });
    }

    logEvent(query, {
      user: req.user,
      action: "create",
      entityType: "biomarker",
      entityId: result.insertId,
      details: { nome },
    });

    res.send({ id: result.insertId });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.post("/update", requireRole("admin"), async (req, res) => {
  const { id } = req.body;
  const nome = req.body.nome?.trim();
  const keywords = sanitizeKeywords(req.body.keywords);
  const resultados = sanitizeResultados(req.body.resultados);

  if (!id || !nome || !keywords.length) {
    return res.status(400).send({
      message: "Nome e pelo menos uma palavra-chave são obrigatórios",
    });
  }

  try {
    const existing = await query(
      "SELECT id FROM biomarkers WHERE LOWER(nome) = LOWER(?) AND id != ?",
      [nome, id]
    );

    if (existing.length) {
      return res
        .status(409)
        .send({ message: "Já existe um biomarcador com este nome." });
    }

    await query("UPDATE biomarkers SET nome = ?, keywords = ? WHERE id = ?", [
      nome,
      JSON.stringify(keywords),
      id,
    ]);

    // Substitui a lista completa de resultados em vez de tentar comparar
    // linha a linha - é uma lista pequena e evita ter de sincronizar
    // adições/remoções/edições feitas no formulário.
    await query("DELETE FROM biomarker_results WHERE biomarker_id = ?", [id]);

    for (const resultado of resultados) {
      await query("INSERT INTO biomarker_results SET ?", {
        biomarker_id: id,
        value: resultado.value,
        keywords: JSON.stringify(resultado.keywords),
      });
    }

    logEvent(query, {
      user: req.user,
      action: "update",
      entityType: "biomarker",
      entityId: id,
      details: { nome },
    });

    res.send({ id });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.post("/delete", requireRole("admin"), async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).send({ message: "Dados inválidos" });
  }

  try {
    const [record] = await query("SELECT nome FROM biomarkers WHERE id = ?", [
      id,
    ]);

    if (!record) {
      return res.status(404).send({ message: "Registo não encontrado" });
    }

    const [{ n_utilizacoes }] = await query(
      "SELECT COUNT(*) AS n_utilizacoes FROM hospital_technical WHERE biomarcador = ?",
      [record.nome]
    );

    if (n_utilizacoes > 0) {
      return res.status(400).send({
        message: "Este biomarcador já foi utilizado e não pode ser eliminado.",
      });
    }

    await query("DELETE FROM biomarkers WHERE id = ?", [id]);

    logEvent(query, {
      user: req.user,
      action: "delete",
      entityType: "biomarker",
      entityId: id,
      details: { nome: record.nome },
    });

    res.send({ id });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

module.exports = router;
