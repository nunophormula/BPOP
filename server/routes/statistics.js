const express = require("express");
const router = express.Router();
const util = require("util");
const db = require("../utils/database");
const { scopeToOwnHospital } = require("../utils/authorize");

const query = util.promisify(db.query).bind(db);

router.use(scopeToOwnHospital("hospitalId"));

// Número de hospitais
router.get("/hospitalsCount", async (req, res) => {
  try {
    const { hospitalId } = req.query;

    if (hospitalId) {
      return res.json({ count: 1 });
    }

    const result = await query("SELECT COUNT(*) AS count from hospitals");

    res.json(result[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Erro ao obter número de hospitais",
      details: err.message,
    });
  }
});

// Número total de submissões
router.get("/submissionsCount", async (req, res) => {
  try {
    const { hospitalId } = req.query;

    let sql = `
      SELECT COUNT(*) AS count
      FROM submissions
    `;

    const params = [];

    if (hospitalId) {
      sql += ` WHERE hospital_id = ?`;
      params.push(hospitalId);
    }

    const result = await query(sql, params);

    res.json(result[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Erro ao obter número de submissões",
      details: err.message,
    });
  }
});

// Top clones / anticorpos
router.get("/topClones", async (req, res) => {
  try {
    const { hospitalId } = req.query;

    // Submissões mais antigas gravam o nome diretamente em `anticorpo`;
    // as mais recentes só gravam `anticorpo_id`, ficando o nome a NULL.
    // O COALESCE junta as duas para a distribuição contar todas.
    let sql = `
      SELECT
        COALESCE(s.anticorpo, a.nome) AS anticorpo,
        COUNT(*) AS total
      FROM submissions s
      LEFT JOIN antibodies a ON a.id = s.anticorpo_id
      WHERE COALESCE(s.anticorpo, a.nome) IS NOT NULL
        AND COALESCE(s.anticorpo, a.nome) != ''
    `;

    const params = [];

    if (hospitalId) {
      sql += ` AND s.hospital_id = ?`;
      params.push(hospitalId);
    }

    sql += `
      GROUP BY COALESCE(s.anticorpo, a.nome)
      ORDER BY total DESC
      LIMIT 3
    `;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: "Erro ao buscar anticorpos",
      details: err.message,
    });
  }
});

// Número de submissões feitas hoje
router.get("/submissionsTodayCount", async (req, res) => {
  try {
    const { hospitalId } = req.query;

    let sql = `
      SELECT COUNT(*) AS count
      FROM submissions
      WHERE DATE(created_at) = CURDATE()
    `;

    const params = [];

    if (hospitalId) {
      sql += ` AND hospital_id = ?`;
      params.push(hospitalId);
    }

    const result = await query(sql, params);

    res.json(result[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Erro ao obter submissões de hoje",
      details: err.message,
    });
  }
});

// Número de representantes hospitalares
router.get("/usersCount", async (req, res) => {
  try {
    const { hospitalId } = req.query;

    let sql = `
      SELECT COUNT(*) AS count
      FROM login
      WHERE role IN ('adminHospital', 'repHospitalar')
    `;

    const params = [];

    if (hospitalId) {
      sql += ` AND hospital_id = ?`;
      params.push(hospitalId);
    }

    const result = await query(sql, params);

    res.json(result[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Erro ao obter número de utilizadores",
      details: err.message,
    });
  }
});

// Submissões recentes
router.get("/recentSubmissions", async (req, res) => {
  try {
    const { hospitalId } = req.query;

    let sql = `
      SELECT
        s.id,
        s.login_id,
        l.nome AS login_name,
        l.avatar AS login_avatar,
        h.nome AS hospital_name,
        s.type,
        s.patient,
        s.created_at
      FROM submissions s
      INNER JOIN login l ON s.login_id = l.id
      LEFT JOIN hospitals h ON s.hospital_id = h.id
    `;

    const params = [];

    if (hospitalId) {
      sql += ` WHERE s.hospital_id = ?`;
      params.push(hospitalId);
    }

    sql += `
      ORDER BY s.created_at DESC
      LIMIT 10
    `;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: "Erro ao buscar submissões recentes",
      details: err.message,
    });
  }
});

// Top plataformas
router.get("/topPlatforms", async (req, res) => {
  try {
    const { hospitalId } = req.query;

    // Mesma lógica do /topClones: junta o nome gravado diretamente com o
    // nome resolvido via plataforma_id, para contar submissões dos dois tipos.
    let sql = `
      SELECT
        COALESCE(s.plataforma, p.nome) AS plataforma,
        COUNT(*) AS total
      FROM submissions s
      LEFT JOIN platforms p ON p.id = s.plataforma_id
      WHERE COALESCE(s.plataforma, p.nome) IS NOT NULL
        AND COALESCE(s.plataforma, p.nome) != ''
    `;

    const params = [];

    if (hospitalId) {
      sql += ` AND s.hospital_id = ?`;
      params.push(hospitalId);
    }

    sql += `
      GROUP BY COALESCE(s.plataforma, p.nome)
      ORDER BY total DESC
      LIMIT 3
    `;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: "Erro ao buscar plataformas",
      details: err.message,
    });
  }
});

// Top produtos
router.get("/topProducts", async (req, res) => {
  try {
    const { hospitalId } = req.query;

    let sql = `
      SELECT
        produto,
        COUNT(*) AS total
      FROM submissions
      WHERE produto IS NOT NULL
        AND produto != ''
    `;

    const params = [];

    if (hospitalId) {
      sql += ` AND hospital_id = ?`;
      params.push(hospitalId);
    }

    sql += `
      GROUP BY produto
      ORDER BY total DESC
      LIMIT 3
    `;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: "Erro ao buscar produtos",
      details: err.message,
    });
  }
});

// Estatísticas por distrito
router.get("/districts", async (req, res) => {
  try {
    const { hospitalId } = req.query;

    let sql = `
      SELECT
        h.distrito,
        COUNT(s.id) AS count
      FROM submissions s
      INNER JOIN login l ON s.login_id = l.id
      INNER JOIN hospitals h ON l.hospital_id = h.id
    `;

    const params = [];

    if (hospitalId) {
      sql += ` WHERE h.id = ?`;
      params.push(hospitalId);
    }

    sql += `
      GROUP BY h.distrito
      ORDER BY count DESC
    `;

    const result = await query(sql, params);

    res.json(result);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Erro ao buscar estatísticas por distrito",
      details: err.message,
    });
  }
});

module.exports = router;
