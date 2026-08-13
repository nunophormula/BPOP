const express = require("express");
const util = require("util");
const nodemailer = require("nodemailer");

const router = express.Router();
const db = require("../utils/database");
const { requireRole } = require("../utils/authorize");
const { logEvent } = require("../utils/auditLog");
const query = util.promisify(db.query).bind(db);

const ENTITIES = {
  platform: { table: "platforms", technicalColumn: "plataforma" },
  antibody: { table: "antibodies", technicalColumn: "anticorpo" },
};

const ENTITY_LABELS = {
  platform: "plataforma",
  antibody: "anticorpo",
};

const APP_URL = "http://localhost:5173";

function getEntity(type) {
  return ENTITIES[type];
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}

async function sendMail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"PD-L1 & HER-2" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

router.get("/read", async (req, res) => {
  const entity = getEntity(req.query.type);

  if (!entity) {
    return res.status(400).send({ message: "Tipo inválido" });
  }

  const requestedStatus = req.query.status || "approved";
  const isAdmin = req.user.role === "admin";

  const conditions = [];
  const params = [];

  if (requestedStatus === "all") {
    if (!isAdmin) {
      return res.status(403).send({ message: "Acesso negado." });
    }
  } else if (["approved", "pending", "rejected"].includes(requestedStatus)) {
    conditions.push("p.status = ?");
    params.push(requestedStatus);

    // Não-admin só pode ver o estado das próprias sugestões pendentes/
    // rejeitadas (não as de outros utilizadores do mesmo hospital).
    if (requestedStatus !== "approved" && !isAdmin) {
      conditions.push("p.created_by = ?");
      params.push(req.user.id);
    }
  } else {
    return res.status(400).send({ message: "status inválido" });
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  try {
    const rows = await query(
      `
      SELECT
        p.id,
        p.nome,
        p.status,
        p.created_at,
        p.hospital_id,
        h.nome AS hospital_nome,
        p.created_by,
        cb.nome AS criado_por,
        p.reviewed_by,
        rb.nome AS revisto_por,
        p.reviewed_at,
        l.nome AS administrador,
        (
          SELECT COUNT(*)
          FROM hospital_technical ht
          WHERE ht.${entity.technicalColumn} = p.nome
        ) AS n_utilizacoes
      FROM ${entity.table} p
      LEFT JOIN login l ON l.id = p.admin_id
      LEFT JOIN login cb ON cb.id = p.created_by
      LEFT JOIN login rb ON rb.id = p.reviewed_by
      LEFT JOIN hospitals h ON h.id = p.hospital_id
      ${whereClause}
      ORDER BY p.created_at DESC
    `,
      params
    );

    res.send(rows);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.get("/stats", requireRole("admin"), async (req, res) => {
  try {
    const [[platforms]] = await Promise.all([
      query("SELECT COUNT(*) AS total FROM platforms WHERE status='approved'"),
    ]);
    const [[antibodies]] = await Promise.all([
      query("SELECT COUNT(*) AS total FROM antibodies WHERE status='approved'"),
    ]);
    const [[loadsToday]] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*) FROM platforms WHERE status='approved' AND DATE(created_at) = CURDATE()) +
          (SELECT COUNT(*) FROM antibodies WHERE status='approved' AND DATE(created_at) = CURDATE())
          AS total
      `),
    ]);
    const [[pending]] = await Promise.all([
      query(`
        SELECT
          (SELECT COUNT(*) FROM platforms WHERE status='pending') +
          (SELECT COUNT(*) FROM antibodies WHERE status='pending')
          AS total
      `),
    ]);

    res.send({
      platforms: platforms.total,
      antibodies: antibodies.total,
      loadsToday: loadsToday.total,
      total: platforms.total + antibodies.total,
      pending: pending.total,
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

// Contagem de plataformas/anticorpos pendentes para o badge do menu "Gestão
// de dados" — admin vê o total global, os restantes roles só as sugestões
// da própria instituição (são as únicas que lhes dizem respeito).
router.get("/pendingCount", async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";

    const platformQuery = isAdmin
      ? "SELECT COUNT(*) AS total FROM platforms WHERE status = 'pending'"
      : "SELECT COUNT(*) AS total FROM platforms WHERE status = 'pending' AND hospital_id = ?";
    const antibodyQuery = isAdmin
      ? "SELECT COUNT(*) AS total FROM antibodies WHERE status = 'pending'"
      : "SELECT COUNT(*) AS total FROM antibodies WHERE status = 'pending' AND hospital_id = ?";
    const params = isAdmin ? [] : [req.user.hospital_id];

    const [[platforms], [antibodies]] = await Promise.all([
      query(platformQuery, params),
      query(antibodyQuery, params),
    ]);

    res.send({ pending: (platforms.total || 0) + (antibodies.total || 0) });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.post("/create", requireRole("admin"), async (req, res) => {
  const { type, nome, admin_id } = req.body;
  const entity = getEntity(type);

  if (!entity || !nome || !admin_id) {
    return res.status(400).send({ message: "Dados inválidos" });
  }

  try {
    const existing = await query(
      `SELECT id FROM ${entity.table} WHERE LOWER(nome) = LOWER(?)`,
      [nome.trim()]
    );

    if (existing.length) {
      return res
        .status(409)
        .send({ message: "Já existe um registo com este nome." });
    }

    const result = await query(`INSERT INTO ${entity.table} SET ?`, {
      nome: nome.trim(),
      admin_id,
      created_by: admin_id,
    });

    res.send(result);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.post("/update", requireRole("admin"), async (req, res) => {
  const { type, id, nome } = req.body;
  const entity = getEntity(type);

  if (!entity || !id || !nome) {
    return res.status(400).send({ message: "Dados inválidos" });
  }

  try {
    const existing = await query(
      `SELECT id FROM ${entity.table} WHERE LOWER(nome) = LOWER(?) AND id != ?`,
      [nome.trim(), id]
    );

    if (existing.length) {
      return res
        .status(409)
        .send({ message: "Já existe um registo com este nome." });
    }

    const result = await query(
      `UPDATE ${entity.table} SET nome = ? WHERE id = ?`,
      [nome.trim(), id]
    );

    res.send(result);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.post("/delete", requireRole("admin"), async (req, res) => {
  const { type, id } = req.body;
  const entity = getEntity(type);

  if (!entity || !id) {
    return res.status(400).send({ message: "Dados inválidos" });
  }

  try {
    const [record] = await query(
      `SELECT nome, status FROM ${entity.table} WHERE id = ?`,
      [id]
    );

    if (!record) {
      return res.status(404).send({ message: "Registo não encontrado" });
    }

    if (record.status === "pending") {
      return res.status(400).send({
        message:
          "Uma sugestão pendente não pode ser eliminada; aprove ou rejeite primeiro.",
      });
    }

    const [{ n_utilizacoes }] = await query(
      `SELECT COUNT(*) AS n_utilizacoes FROM hospital_technical WHERE ${entity.technicalColumn} = ?`,
      [record.nome]
    );

    if (n_utilizacoes > 0) {
      return res.status(400).send({
        message: "Este registo já foi utilizado e não pode ser eliminado.",
      });
    }

    const result = await query(`DELETE FROM ${entity.table} WHERE id = ?`, [
      id,
    ]);
    res.send(result);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.post(
  "/suggest",
  requireRole("adminHospital", "repHospitalar"),
  async (req, res) => {
    const { type, nome } = req.body;
    const entity = getEntity(type);

    if (!entity || !nome?.trim() || !req.user.hospital_id) {
      return res.status(400).send({ message: "Dados inválidos" });
    }

    try {
      const [existing] = await query(
        `SELECT id, status FROM ${entity.table} WHERE LOWER(nome) = LOWER(?)`,
        [nome.trim()]
      );

      let id;

      if (existing) {
        if (existing.status !== "rejected") {
          return res.status(409).send({
            message: "Já existe um registo (ou sugestão) com este nome.",
          });
        }

        // Reabre uma sugestão previamente rejeitada em vez de duplicar a linha.
        await query(
          `UPDATE ${entity.table}
           SET status='pending', admin_id=NULL, created_by=?, hospital_id=?, reviewed_by=NULL, reviewed_at=NULL
           WHERE id = ?`,
          [req.user.id, req.user.hospital_id, existing.id]
        );

        id = existing.id;
      } else {
        const result = await query(`INSERT INTO ${entity.table} SET ?`, {
          nome: nome.trim(),
          status: "pending",
          admin_id: null,
          created_by: req.user.id,
          hospital_id: req.user.hospital_id,
        });

        id = result.insertId;
      }

      logEvent(query, {
        user: req.user,
        action: "suggest",
        entityType: type,
        entityId: id,
        details: { nome: nome.trim() },
      });

      try {
        const admins = await query(
          "SELECT email FROM login WHERE role = 'admin' AND email IS NOT NULL AND email != ''"
        );

        if (admins.length) {
          const [hospital] = await query(
            "SELECT nome FROM hospitals WHERE id = ?",
            [req.user.hospital_id]
          );

          await sendMail({
            to: admins.map((a) => a.email).join(","),
            subject: `Nova sugestão de ${ENTITY_LABELS[type]} para aprovar`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
                <h2 style="color: #1F2937;">Nova sugestão pendente</h2>
                <p>
                  <strong>${escapeHtml(req.user.nome)}</strong>
                  (${escapeHtml(hospital?.nome || "hospital desconhecido")})
                  sugeriu ${
                    type === "platform" ? "a plataforma" : "o anticorpo"
                  }
                  "<strong>${escapeHtml(
                    nome.trim()
                  )}</strong>", que aguarda a sua aprovação.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${APP_URL}/app/data-management" style="background-color: #F5702B; color: #fff; padding: 12px 24px; border-radius: 29px; text-decoration: none; font-weight: bold;">
                    Rever pendentes
                  </a>
                </div>
                <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
                <p style="font-size: 12px; color: #6B7280;">PD-L1 & HER-2</p>
              </div>
            `,
          });
        }
      } catch (e) {
        console.log("Erro ao enviar email de notificação de sugestão", e);
      }

      res.send({ id, status: "pending" });
    } catch (e) {
      console.log(e);
      res.status(500).send({ message: "Some error on server.", error: e });
    }
  }
);

router.post("/approve", requireRole("admin"), async (req, res) => {
  const { type, id } = req.body;
  const entity = getEntity(type);

  if (!entity || !id) {
    return res.status(400).send({ message: "Dados inválidos" });
  }

  try {
    const [record] = await query(
      `SELECT nome, status, created_by FROM ${entity.table} WHERE id = ?`,
      [id]
    );
    if (!record) {
      return res.status(404).send({ message: "Registo não encontrado" });
    }
    if (record.status !== "pending") {
      return res
        .status(400)
        .send({ message: "Este registo não está pendente." });
    }
    const dupApproved = await query(
      `SELECT id FROM ${entity.table} WHERE LOWER(nome)=LOWER(?) AND status='approved' AND id != ?`,
      [record.nome, id]
    );
    if (dupApproved.length) {
      return res
        .status(409)
        .send({ message: "Já existe um registo aprovado com este nome." });
    }

    await query(
      `UPDATE ${entity.table}
       SET status='approved', admin_id=?, reviewed_by=?, reviewed_at=NOW()
       WHERE id = ?`,
      [req.user.id, req.user.id, id]
    );

    logEvent(query, {
      user: req.user,
      action: "approve",
      entityType: type,
      entityId: id,
      details: { nome: record.nome },
    });

    try {
      const [suggester] = await query(
        "SELECT nome, email FROM login WHERE id = ?",
        [record.created_by]
      );

      if (suggester?.email) {
        await sendMail({
          to: suggester.email,
          subject: `Sugestão de ${ENTITY_LABELS[type]} aprovada`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
              <h2 style="color: #1F2937;">Olá ${escapeHtml(
                suggester.nome
              )},</h2>
              <p>
                A sua sugestão de ${
                  type === "platform" ? "plataforma" : "anticorpo"
                }
                "<strong>${escapeHtml(record.nome)}</strong>" foi
                <strong style="color: #16a34a;">aprovada</strong> e já está disponível para uso.
              </p>
              <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
              <p style="font-size: 12px; color: #6B7280;">PD-L1 & HER-2</p>
            </div>
          `,
        });
      }
    } catch (e) {
      console.log("Erro ao enviar email de aprovação", e);
    }

    res.send({ id, status: "approved" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.post("/reject", requireRole("admin"), async (req, res) => {
  const { type, id, reason } = req.body;
  const entity = getEntity(type);

  if (!entity || !id) {
    return res.status(400).send({ message: "Dados inválidos" });
  }

  try {
    const [record] = await query(
      `SELECT nome, status, created_by FROM ${entity.table} WHERE id = ?`,
      [id]
    );

    if (!record) {
      return res.status(404).send({ message: "Registo não encontrado" });
    }

    if (record.status !== "pending") {
      return res
        .status(400)
        .send({ message: "Este registo não está pendente." });
    }

    await query(
      `UPDATE ${entity.table}
       SET status='rejected', reviewed_by=?, reviewed_at=NOW()
       WHERE id = ?`,
      [req.user.id, id]
    );

    logEvent(query, {
      user: req.user,
      action: "reject",
      entityType: type,
      entityId: id,
      details: { nome: record.nome, reason: reason || null },
    });

    try {
      const [suggester] = await query(
        "SELECT nome, email FROM login WHERE id = ?",
        [record.created_by]
      );

      if (suggester?.email) {
        await sendMail({
          to: suggester.email,
          subject: `Sugestão de ${ENTITY_LABELS[type]} rejeitada`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
              <h2 style="color: #1F2937;">Olá ${escapeHtml(
                suggester.nome
              )},</h2>
              <p>
                A sua sugestão de ${
                  type === "platform" ? "plataforma" : "anticorpo"
                }
                "<strong>${escapeHtml(record.nome)}</strong>" foi
                <strong style="color: #dc2626;">rejeitada</strong>.
              </p>
              ${
                reason
                  ? `<p><strong>Motivo:</strong> ${escapeHtml(reason)}</p>`
                  : ""
              }
              <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
              <p style="font-size: 12px; color: #6B7280;">PD-L1 & HER-2</p>
            </div>
          `,
        });
      }
    } catch (e) {
      console.log("Erro ao enviar email de rejeição", e);
    }

    res.send({ id, status: "rejected" });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

module.exports = router;
