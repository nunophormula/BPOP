const express = require("express");
const util = require("util");

const router = express.Router();
const db = require("../utils/database");
const query = util.promisify(db.query).bind(db);

// Agrupamento simplificado dos distritos em 3 macro-regiões, só para a
// página pública de estatísticas (a app interna usa distrito diretamente).
const REGIAO_POR_DISTRITO = {
  Braga: "Norte",
  Bragança: "Norte",
  Porto: "Norte",
  "Viana do Castelo": "Norte",
  "Vila Real": "Norte",

  Aveiro: "Centro",
  "Castelo Branco": "Centro",
  Coimbra: "Centro",
  Guarda: "Centro",
  Leiria: "Centro",
  Viseu: "Centro",

  Beja: "Sul",
  Évora: "Sul",
  Faro: "Sul",
  Lisboa: "Sul",
  Portalegre: "Sul",
  Santarém: "Sul",
  Setúbal: "Sul",
};

router.get("/overview", async (req, res) => {
  try {
    const { biomarcador } = req.query;

    if (!biomarcador) {
      return res.status(400).json({
        success: false,
        message: "biomarcador é obrigatório",
      });
    }

    const [
      [{ total }],
      districtRows,
      scoreRows,
      productRows,
      cloneRows,
    ] = await Promise.all([
      query(
        `SELECT COUNT(*) AS total FROM submissions WHERE biomarcador = ?`,
        [biomarcador]
      ),
      query(
        `
        SELECT h.distrito, COUNT(s.id) AS total
        FROM submissions s
        INNER JOIN hospitals h ON h.id = s.hospital_id
        WHERE s.biomarcador = ?
        GROUP BY h.distrito
        ORDER BY total DESC
        `,
        [biomarcador]
      ),
      query(
        `
        SELECT resultado, COUNT(*) AS total
        FROM submissions
        WHERE biomarcador = ? AND resultado IS NOT NULL AND resultado != ''
        GROUP BY resultado
        ORDER BY total DESC
        LIMIT 5
        `,
        [biomarcador]
      ),
      query(
        `
        SELECT produto, COUNT(*) AS total
        FROM submissions
        WHERE biomarcador = ? AND produto IS NOT NULL AND produto != ''
        GROUP BY produto
        ORDER BY total DESC
        `,
        [biomarcador]
      ),
      query(
        `
        SELECT
          COALESCE(s.anticorpo, a.nome) AS anticorpo,
          COUNT(*) AS total
        FROM submissions s
        LEFT JOIN antibodies a ON a.id = s.anticorpo_id
        WHERE s.biomarcador = ?
          AND COALESCE(s.anticorpo, a.nome) IS NOT NULL
          AND COALESCE(s.anticorpo, a.nome) != ''
        GROUP BY COALESCE(s.anticorpo, a.nome)
        ORDER BY total DESC
        LIMIT 5
        `,
        [biomarcador]
      ),
    ]);

    const regionTotals = {};

    districtRows.forEach((row) => {
      const regiao = REGIAO_POR_DISTRITO[row.distrito];

      if (!regiao) return;

      regionTotals[regiao] = (regionTotals[regiao] || 0) + Number(row.total);
    });

    const regions = ["Norte", "Centro", "Sul"].map((regiao) => ({
      regiao,
      total: regionTotals[regiao] || 0,
    }));

    return res.json({
      success: true,
      total,
      regions,
      districts: districtRows.slice(0, 5),
      scores: scoreRows,
      products: productRows,
      clones: cloneRows,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Erro ao calcular estatísticas",
      error: err.message,
    });
  }
});

// Lista de registos (uma linha por submissão) — só campos técnicos/
// institucionais, nunca patient/diagnostic.
router.get("/registry", async (req, res) => {
  try {
    const { biomarcador } = req.query;

    if (!biomarcador) {
      return res.status(400).json({
        success: false,
        message: "biomarcador é obrigatório",
      });
    }

    const rows = await query(
      `
      SELECT
        s.id,
        h.nome AS hospital,
        YEAR(s.created_at) AS ano,
        h.distrito,
        COALESCE(s.plataforma, plat.nome) AS plataforma,
        COALESCE(s.anticorpo, a.nome) AS anticorpo,
        s.topografia,
        s.produto,
        s.resultado
      FROM submissions s
      INNER JOIN hospitals h ON h.id = s.hospital_id
      LEFT JOIN platforms plat ON plat.id = s.plataforma_id
      LEFT JOIN antibodies a ON a.id = s.anticorpo_id
      WHERE s.biomarcador = ?
      ORDER BY s.created_at DESC
      `,
      [biomarcador]
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Erro ao ler lista de registos",
      error: err.message,
    });
  }
});

module.exports = router;
