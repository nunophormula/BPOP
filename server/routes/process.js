const fs = require("fs");
const express = require("express");
const multer = require("multer");
const PDFParser = require("pdf2json");
var util = require("util");

const upload = multer({ dest: "uploads/" });
const router = express.Router();

var db = require("../utils/database");
const query = util.promisify(db.query).bind(db);

router.get("/", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM submissions ORDER BY patient, id");

    const grouped = {};
    rows.forEach((row) => {
      if (!grouped[row.patient]) grouped[row.patient] = [];
      grouped[row.patient].push(row);
    });

    res.send({ success: true, data: grouped });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ success: false, message: "Erro ao buscar submissões" });
  }
});

router.get("/readByHospital", async (req, res) => {
  try {
    const hospitalId = req.query.hospital_id;

    if (!hospitalId) {
      return res.status(400).send({
        success: false,
        message: "Hospital ID é obrigatório",
      });
    }

    const hospitalRows = await query(
      `
      SELECT id, nome 
      from hospitals 
      WHERE id = ?
      `,
      [hospitalId]
    );

    if (!hospitalRows.length) {
      return res.status(404).send({
        success: false,
        message: "Hospital não encontrado",
      });
    }

    const hospital = hospitalRows[0];

    const rows = await query(
      `
      SELECT 
        s.id,
        s.type,
        s.patient,
        s.diagnostic,
        s.hospital_id,
        s.login_id,

        s.topografia,
        s.plataforma,
        s.anticorpo,
        s.produto,
        s.resultado,

        s.created_at,

        l.nome AS login_name,
        l.avatar AS login_avatar,
        l.email AS login_email

      FROM submissions s
      LEFT JOIN login l ON l.id = s.login_id
      WHERE s.hospital_id = ?
      ORDER BY s.patient, s.id
      `,
      [hospitalId]
    );

    return res.send({
      success: true,
      data: rows,
      hospital,
      message: rows.length
        ? "Submissões encontradas"
        : "Nenhuma submissão encontrada",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).send({
      success: false,
      message: "Erro ao buscar submissões por hospital",
      error: err.message,
    });
  }
});

module.exports = router;
