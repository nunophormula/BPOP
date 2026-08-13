const fs = require("fs");
const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const util = require("util");

const upload = multer({ dest: "uploads/" });
const router = express.Router();

const db = require("../utils/database");
const { requireRole, requireOwnHospital } = require("../utils/authorize");
const { logEvent } = require("../utils/auditLog");
const { hashIdentifier } = require("../utils/identifierHash");

const query = util.promisify(db.query).bind(db);

router.post("/readExcel", upload.single("excel"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Excel não enviado" });
  }
  const filePath = req.file.path;
  try {
    const workbook = XLSX.readFile(filePath);
    const allSheets = [];
    workbook.SheetNames.forEach((sheetName) => {
      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const columns = rawRows.length ? Object.keys(rawRows[0]) : [];
      const items = rawRows;

      allSheets.push({
        sheet: sheetName,
        columns, //  lista de colunas
        rawRows, //  dados completos
        items,
      });
    });

    fs.unlinkSync(filePath);

    return res.json({
      success: true,
      sheets: allSheets,
    });
  } catch (err) {
    fs.unlinkSync(filePath);

    return res.status(500).json({
      error: "Erro ao processar Excel",
      details: err.message,
    });
  }
});

/* CREATE SUBMISSIONS */
router.post("/create", async (req, res) => {
  const { submissions } = req.body;

  if (!Array.isArray(submissions) || !submissions.length) {
    return res.status(400).json({
      error: "Submissions inválidas",
    });
  }

  if (req.user.role !== "admin") {
    const invalid = submissions.some(
      (s) => String(s.hospital_id) !== String(req.user.hospital_id)
    );
    if (invalid) {
      return res.status(400).json({
        error: "Não tem permissão para submeter dados para esta instituição",
      });
    }
    submissions.forEach((s) => {
      s.login_id = req.user.id;
    });
  }

  try {
    await query("START TRANSACTION");

    // Um template pode ser guardado com plataforma/anticorpo ainda por
    // aprovar (fica "não validado" na listagem), mas só pode ser usado numa
    // submissão depois de aprovado — por isso o bloqueio fica aqui, não no
    // save do template.
    const plataformaIds = [
      ...new Set(submissions.map((s) => s.plataforma_id).filter(Boolean)),
    ];
    const anticorpoIds = [
      ...new Set(submissions.map((s) => s.anticorpo_id).filter(Boolean)),
    ];

    if (plataformaIds.length || anticorpoIds.length) {
      const [platformRows, antibodyRows] = await Promise.all([
        plataformaIds.length
          ? query("SELECT id, status FROM platforms WHERE id IN (?)", [
              plataformaIds,
            ])
          : [],
        anticorpoIds.length
          ? query("SELECT id, status FROM antibodies WHERE id IN (?)", [
              anticorpoIds,
            ])
          : [],
      ]);

      const platformStatus = new Map(platformRows.map((p) => [p.id, p.status]));
      const antibodyStatus = new Map(antibodyRows.map((a) => [a.id, a.status]));

      const blocked = submissions.find(
        (s) =>
          (s.plataforma_id && platformStatus.get(s.plataforma_id) !== "approved") ||
          (s.anticorpo_id && antibodyStatus.get(s.anticorpo_id) !== "approved")
      );

      if (blocked) {
        await query("ROLLBACK");

        return res.status(400).json({
          error: `O template de ${blocked.biomarcador || "biomarcador"} / ${
            blocked.topografia || "topografia"
          } tem uma plataforma e/ou anticorpo ainda por aprovar e não pode ser usado em submissões até aprovação do administrador.`,
        });
      }
    }

    const created = [];

    for (let i = 0; i < submissions.length; i++) {
      const s = submissions[i];

      // patient/diagnostic chegam em claro e são pseudonimizados aqui, tal
      // como as passwords: nunca ficam gravados os valores originais.
      const patientHash = s.patient ? hashIdentifier(s.patient) : null;
      const diagnosticHash = s.diagnostic ? hashIdentifier(s.diagnostic) : null;

      let submissionId;

      if (s.override_id) {
        // Substitui uma submissão existente em vez de criar uma duplicada
        // (o utilizador escolheu "substituir" no ecrã de diagnósticos já
        // existentes). O hospital_id no WHERE impede substituir uma
        // submissão de outra instituição.
        const updateResult = await query(
          `
          UPDATE submissions SET
            patient = ?,
            diagnostic = ?,
            biomarcador = ?,
            login_id = ?,
            type = ?,
            topografia = ?,
            plataforma = ?,
            anticorpo = ?,
            plataforma_id = ?,
            anticorpo_id = ?,
            produto = ?,
            resultado = ?,
            technical_data = ?
          WHERE id = ? AND hospital_id = ?
          `,
          [
            patientHash,
            diagnosticHash,
            s.biomarcador || null,
            s.login_id || null,
            s.type || null,
            s.topografia || null,
            s.plataforma || null,
            s.anticorpo || null,
            s.plataforma_id || null,
            s.anticorpo_id || null,
            s.produto || null,
            s.resultado || null,
            s.technical_data || null,
            s.override_id,
            s.hospital_id || null,
          ]
        );

        if (!updateResult.affectedRows) {
          throw new Error(
            `Submissão a substituir (id ${s.override_id}) não encontrada nesta instituição`
          );
        }

        submissionId = s.override_id;
      } else {
        const result = await query(
          `
          INSERT INTO submissions (
            patient,
            diagnostic,
            biomarcador,
            hospital_id,
            login_id,
            type,
            topografia,
            plataforma,
            anticorpo,
            plataforma_id,
            anticorpo_id,
            produto,
            resultado,
            technical_data,
            created_at
          )
          VALUES (
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?,
            ?,
            NOW()
          )
          `,
          [
            patientHash,
            diagnosticHash,
            s.biomarcador || null,
            s.hospital_id || null,
            s.login_id || null,
            s.type || null,
            s.topografia || null,
            s.plataforma || null,
            s.anticorpo || null,
            s.plataforma_id || null,
            s.anticorpo_id || null,
            s.produto || null,
            s.resultado || null,
            s.technical_data || null,
          ]
        );

        submissionId = result.insertId;
      }

      created.push({
        index: i + 1,
        id: submissionId,
        overridden: !!s.override_id,
        patient: patientHash,
        diagnostic: diagnosticHash,
        biomarker: s.biomarcador,
        product: s.produto,
        result: s.resultado,
      });
    }

    await query("COMMIT");

    created.forEach((c) => {
      logEvent(query, {
        user: req.user,
        action: c.overridden ? "submission_override" : "submission_create",
        entityType: "submission",
        entityId: c.id,
        details: { patient: c.patient },
      });
    });

    return res.json({
      success: true,
      submissions: created,
    });
  } catch (err) {
    await query("ROLLBACK");

    console.error(err);

    return res.status(500).json({
      error: "Erro ao criar submissões",
      details: err.message,
    });
  }
});

/* CHECK EXISTING (patient/diagnostic são hashes, o cliente não os pode
   comparar sozinho — hash-se aqui os valores em claro recebidos e vê-se
   quais já existem para o hospital). diagnostics vem como pares
   {diagnostic, biomarcador} porque o mesmo nº de diagnóstico pode ter
   submissões de biomarcadores diferentes — cada uma é uma duplicata
   distinta. Devolve o id da submissão existente para permitir substituí-la
   (override) mais tarde em vez de só assinalar "já existe". */
router.post(
  "/checkExisting",
  requireOwnHospital((req) => req.body.hospital_id),
  async (req, res) => {
    try {
      const { hospital_id, diagnostics = [], patients = [] } = req.body;

      if (!hospital_id) {
        return res.status(400).json({
          success: false,
          message: "hospital_id é obrigatório",
        });
      }

      const diagnosticHashes = diagnostics.map((d) => hashIdentifier(d.diagnostic));
      const patientHashes = patients.map(hashIdentifier);

      const [diagnosticRows, patientRows] = await Promise.all([
        diagnosticHashes.length
          ? query(
              `SELECT id, diagnostic, biomarcador FROM submissions
               WHERE hospital_id = ? AND diagnostic IN (?)
               ORDER BY created_at DESC`,
              [hospital_id, diagnosticHashes]
            )
          : [],
        patientHashes.length
          ? query(
              `SELECT DISTINCT patient FROM submissions WHERE hospital_id = ? AND patient IN (?)`,
              [hospital_id, patientHashes]
            )
          : [],
      ]);

      // primeira ocorrência por (hash, biomarcador) fica com o id mais
      // recente, graças ao ORDER BY created_at DESC acima.
      const idByHashAndBiomarker = new Map();
      diagnosticRows.forEach((row) => {
        const key = `${row.diagnostic}|${row.biomarcador}`;
        if (!idByHashAndBiomarker.has(key)) {
          idByHashAndBiomarker.set(key, row.id);
        }
      });

      const existingDiagnostics = diagnostics
        .map((d, i) => {
          const key = `${diagnosticHashes[i]}|${d.biomarcador}`;
          const id = idByHashAndBiomarker.get(key);

          return id
            ? { diagnostic: d.diagnostic, biomarcador: d.biomarcador, id }
            : null;
        })
        .filter(Boolean);

      const existingPatientSet = new Set(patientRows.map((r) => r.patient));

      return res.json({
        success: true,
        existingDiagnostics,
        existingPatients: patients.filter((raw, i) =>
          existingPatientSet.has(patientHashes[i])
        ),
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: "Erro ao verificar duplicados",
        error: err.message,
      });
    }
  }
);

router.get(
  "/readByHospital",
  requireOwnHospital((req) => req.query.hospital_id),
  async (req, res) => {
  const { hospital_id } = req.query;

  console.log(hospital_id);

  if (!hospital_id) {
    return res.status(400).json({
      success: false,
      message: "hospital_id é obrigatório",
    });
  }

  try {
    const rows = await query(
      `
      SELECT
        s.id,
        s.patient,
        s.diagnostic,
        s.hospital_id,
        s.biomarcador,
        h.nome AS hospital_nome,
        s.login_id,
        l.nome AS login_name,
        l.avatar AS login_avatar,
        l.email AS login_email,

        s.type,
        s.created_at

      FROM submissions s
      LEFT JOIN hospitals h ON h.id = s.hospital_id
      LEFT JOIN login l ON l.id = s.login_id
      WHERE s.hospital_id = ?
      ORDER BY s.patient DESC, s.created_at DESC
      `,
      [hospital_id]
    );

    return res.json({
      success: true,
      data: rows,
      hospital: rows[0]?.hospital_nome ? { nome: rows[0].hospital_nome } : null,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Erro ao ler submissões por hospital",
      error: err.message,
    });
  }
});

/* UPDATE SUBMISSION - só o autor da submissão (ou um admin) pode corrigir os
   dados extraídos; o biomarcador em si não é editável aqui (mudar de
   biomarcador implicaria reparsing, não uma correção pontual). */
router.post("/update", async (req, res) => {
  const { id, produto, resultado, topografia, plataforma, anticorpo } = req.body;

  if (!id) {
    return res.status(400).json({ error: "id é obrigatório" });
  }

  try {
    const [submission] = await query("SELECT * FROM submissions WHERE id = ?", [id]);

    if (!submission) {
      return res.status(404).json({ error: "Submissão não encontrada" });
    }

    if (
      req.user.role !== "admin" &&
      Number(submission.login_id) !== Number(req.user.id)
    ) {
      return res
        .status(403)
        .json({ error: "Só pode editar as suas próprias submissões" });
    }

    await query(
      `
      UPDATE submissions SET
        produto = ?,
        resultado = ?,
        topografia = ?,
        plataforma = ?,
        anticorpo = ?
      WHERE id = ?
      `,
      [
        produto || null,
        resultado || null,
        topografia || null,
        plataforma || null,
        anticorpo || null,
        id,
      ]
    );

    logEvent(query, {
      user: req.user,
      action: "submission_update",
      entityType: "submission",
      entityId: id,
      details: { produto, resultado, topografia, plataforma, anticorpo },
    });

    const [updated] = await query("SELECT * FROM submissions WHERE id = ?", [id]);

    return res.json({ success: true, submission: updated });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Erro ao atualizar submissão",
      details: err.message,
    });
  }
});

/* READ SUBMISSIONS */
router.get("/read", requireRole("admin"), async (req, res) => {
  try {
    // Submissões mais recentes só gravam plataforma_id/anticorpo_id (o nome
    // fica a NULL), por isso resolve-se o nome via JOIN quando for preciso.
    const rows = await query(`
      SELECT
        s.id,
        s.patient,
        s.diagnostic,
        s.type,
        s.hospital_id,
        h.nome AS hospital_nome,
        s.login_id,
        l.nome AS login_nome,
        l.avatar AS login_avatar,
        s.topografia,
        s.biomarcador,
        COALESCE(s.plataforma, plat.nome) AS plataforma,
        COALESCE(s.anticorpo, anti.nome) AS anticorpo,
        s.produto,
        s.resultado,
        s.created_at
      FROM submissions s
      LEFT JOIN hospitals h ON h.id = s.hospital_id
      LEFT JOIN login l ON l.id = s.login_id
      LEFT JOIN platforms plat ON plat.id = s.plataforma_id
      LEFT JOIN antibodies anti ON anti.id = s.anticorpo_id
      ORDER BY s.id DESC
    `);

    return res.json(rows);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Erro ao ler submissões",
      details: err.message,
    });
  }
});

router.get(
  "/readProcessByHospital",
  requireOwnHospital((req) => req.query.hospital_id),
  async (req, res) => {
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
        s.biomarcador,
        COALESCE(s.plataforma, plat.nome) AS plataforma,
        COALESCE(s.anticorpo, anti.nome) AS anticorpo,
        s.produto,
        s.resultado,

        s.created_at,

        l.nome AS login_name,
        l.avatar AS login_avatar,
        l.email AS login_email

      FROM submissions s
      LEFT JOIN login l ON l.id = s.login_id
      LEFT JOIN platforms plat ON plat.id = s.plataforma_id
      LEFT JOIN antibodies anti ON anti.id = s.anticorpo_id
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
