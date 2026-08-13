const express = require("express");
const util = require("util");

const router = express.Router();
const db = require("../utils/database");
const query = util.promisify(db.query).bind(db);

// "Produto" is the tipo de amostra param — it must always stay limited to
// Biópsia / Peça cirúrgica, so extra values sent by a client are dropped here.
const SAMPLE_TYPE_ALLOWED_VALUES = ["biópsia", "peça cirúrgica"];

router.get("/params", async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        p.id AS param_id,
        p.param_key,
        p.keywords AS param_keywords,
        p.required AS param_required,

        v.id AS value_id,
        v.value,
        v.keywords AS value_keywords

      FROM submission_params_her p
      LEFT JOIN submission_param_values_her v
        ON v.param_id = p.id
      ORDER BY p.created_at DESC;
    `);

    const grouped = {};

    rows.forEach((row) => {
      if (!grouped[row.param_id]) {
        grouped[row.param_id] = {
          id: row.param_id,
          param_key: row.param_key,
          keywords: row.param_keywords ? JSON.parse(row.param_keywords) : [],
          required: !!row.param_required,
          values: [],
        };
      }

      if (row.value_id) {
        grouped[row.param_id].values.push({
          id: row.value_id,
          value: row.value,
          keywords: row.value_keywords ? JSON.parse(row.value_keywords) : [],
          required: !!row.value_required,
        });
      }
    });

    return res.json(Object.values(grouped));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/full", async (req, res) => {
  const { params } = req.body;

  if (!Array.isArray(params)) {
    return res.status(400).json({
      success: false,
      message: "Dados inválidos (params deve ser um array)",
    });
  }

  try {
    await query("START TRANSACTION");

    const existingRows = await query(`
      SELECT id, LOWER(TRIM(param_key)) as param_key
      FROM submission_params_her
    `);

    const existingMap = new Map();
    for (const row of existingRows) {
      existingMap.set(row.param_key, row.id);
    }

    for (const param of params) {
      if (!param?.param_key) continue;

      const key = param.param_key.trim().toLowerCase();

      let param_id = param.id;
      const existingId = existingMap.get(key);

      if (existingId && (!param_id || existingId !== param_id)) {
        throw new Error(
          `Já existe um parâmetro com o nome: "${param.param_key}"`
        );
      }

      // ======================
      // PARAM UPSERT
      // ======================
      if (!param_id) {
        const result = await query(
          `INSERT INTO submission_params_her
           (param_key, keywords, required, created_at)
           VALUES (?, ?, ?, NOW())`,
          [
            param.param_key.trim(),
            JSON.stringify(
              (param.keywords || [])
                .map((k) => k.toLowerCase().trim())
                .filter(Boolean)
            ),
            param.required ? 1 : 0,
          ]
        );

        param_id = result.insertId;
      } else {
        await query(
          `UPDATE submission_params_her
           SET param_key = ?, keywords = ?, required = ?
           WHERE id = ?`,
          [
            param.param_key.trim(),
            JSON.stringify(
              (param.keywords || [])
                .map((k) => k.toLowerCase().trim())
                .filter(Boolean)
            ),
            param.required ? 1 : 0,
            param_id,
          ]
        );
      }

      // ======================
      // VALUES SMART SYNC
      // ======================

      const values =
        key === "produto"
          ? (param.values || []).filter((v) =>
              SAMPLE_TYPE_ALLOWED_VALUES.includes(
                (v?.value || "").trim().toLowerCase()
              )
            )
          : param.values;

      if (Array.isArray(values)) {
        for (const v of values) {
          if (!v?.value) continue;

          const keywords = JSON.stringify(
            (v.keywords || [])
              .map((k) => k.toLowerCase().trim())
              .filter(Boolean)
          );

          const valueClean = v.value.trim().toLowerCase();

          // 🔥 1. SE TEM ID → UPDATE DIRETO
          if (v.id) {
            await query(
              `UPDATE submission_param_values_her
               SET value = ?, keywords = ?
               WHERE id = ? AND param_id = ?`,
              [v.value, keywords, v.id, param_id]
            );

            continue;
          }

          // 🔥 2. SEM ID → VERIFICAR SE JÁ EXISTE ESSE VALUE
          const existingValue = await query(
            `SELECT id FROM submission_param_values_her
             WHERE param_id = ? AND LOWER(value) = ?`,
            [param_id, valueClean]
          );

          if (existingValue.length > 0) {
            // 👉 JÁ EXISTE → SÓ ATUALIZAR KEYWORDS (MERGE)
            await query(
              `UPDATE submission_param_values_her
               SET keywords = ?
               WHERE id = ?`,
              [keywords, existingValue[0].id]
            );
          } else {
            // 👉 NÃO EXISTE → INSERT NOVO VALUE
            await query(
              `INSERT INTO submission_param_values_her
               (param_id, value, keywords, created_at)
               VALUES (?, ?, ?, NOW())`,
              [param_id, v.value, keywords]
            );
          }
        }
      }
    }

    await query("COMMIT");

    return res.json({
      success: true,
      message: "Parâmetros guardados com sucesso",
    });
  } catch (err) {
    await query("ROLLBACK");

    return res.status(500).json({
      success: false,
      message: "Erro ao guardar parâmetros",
      error: err.message,
    });
  }
});

router.post("/values/:param_id", async (req, res) => {
  const { param_id } = req.params;
  const { values } = req.body;

  if (!param_id || !Array.isArray(values)) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    for (const v of values) {
      if (!v?.value) continue;

      await query(
        `INSERT INTO submission_param_values_her
         (param_id, value, keywords, created_at)
         VALUES (?, ?, ?, NOW())`,
        [
          param_id,

          v.value,

          JSON.stringify(
            (v.keywords || [])
              .map((k) => k.toLowerCase().trim())
              .filter(Boolean)
          ),
        ]
      );
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
});

router.put("/params/:param_id", async (req, res) => {
  const { param_id } = req.params;
  const { param_key, keywords, required } = req.body;

  if (!param_id || !param_key) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    await query(
      `UPDATE submission_params_her
       SET param_key = ?, keywords = ?, required = ?
       WHERE id = ?`,
      [
        param_key,

        JSON.stringify(
          (keywords || []).map((k) => k.toLowerCase().trim()).filter(Boolean)
        ),

        required ? 1 : 0,

        param_id,
      ]
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
});

router.put("/values/:value_id", async (req, res) => {
  const { value_id } = req.params;
  const { value, keywords, required } = req.body;

  if (!value_id || !value) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    await query(
      `UPDATE submission_param_values_her
       SET value = ?, keywords = ?
       WHERE id = ?`,
      [
        value,

        JSON.stringify(
          (keywords || []).map((k) => k.toLowerCase().trim()).filter(Boolean)
        ),

        value_id,
      ]
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
});

router.delete("/params/:param_id", async (req, res) => {
  const { param_id } = req.params;

  try {
    await query("START TRANSACTION");

    await query(
      `DELETE FROM submission_param_values_her
       WHERE param_id = ?`,
      [param_id]
    );

    await query(
      `DELETE FROM submission_params_her
       WHERE id = ?`,
      [param_id]
    );

    await query("COMMIT");

    return res.json({ success: true });
  } catch (err) {
    await query("ROLLBACK");

    return res.status(500).json({
      error: err.message,
    });
  }
});

router.delete("/values/:value_id", async (req, res) => {
  const { value_id } = req.params;

  try {
    await query(
      `DELETE FROM submission_param_values_her
       WHERE id = ?`,
      [value_id]
    );

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
    });
  }
});

module.exports = router;
