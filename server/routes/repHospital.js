var express = require("express");
var router = express.Router();
var util = require("util");
var db = require("../utils/database");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { requireRole, requireOwnHospital } = require("../utils/authorize");

const query = util.promisify(db.query).bind(db);

async function hospitalIdOfLogin(id) {
  const [row] = await query("SELECT hospital_id FROM login WHERE id = ?", [id]);
  return row?.hospital_id;
}

router.post(
  "/generatePassword",
  requireRole("admin", "adminHospital"),
  requireOwnHospital((req) => hospitalIdOfLogin(req.body.respId)),
  async (req, res) => {
    const { respId, sendEmail } = req.body;

    if (!respId)
      return res.status(400).send({ message: "Parâmetro respId é obrigatório" });

    try {
      const [resp] = await query("SELECT * FROM login WHERE id = ?", [respId]);
      if (!resp)
        return res.status(404).send({ message: "representante não encontrado" });

      const generateRandomPassword = () => {
        const chars =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
        let password = "";
        for (let i = 0; i < 10; i++) {
          password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
      };
      const newPassword = generateRandomPassword();

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await query("UPDATE login SET password = ? WHERE id = ?", [
        hashedPassword,
        respId,
      ]);

      console.log(process.env.EMAIL_HOST);
      if (sendEmail) {
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
          from: `"PDL1 " <${process.env.EMAIL_USER}>`,
          to: resp.email,
          subject: "Nova password gerada",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
              <h2 style="color: #1F2937;">Olá ${resp.nome},</h2>
              <p>Uma nova password foi gerada para a sua conta no sistema:</p>
              <p style="font-size: 18px; font-weight: bold; background-color: #F3F4F6; padding: 10px; border-radius: 5px; text-align: center;">
                ${newPassword}
              </p>
              <p>Por favor, mantenha-a segura e não partilhe com ninguém.</p>
              <p>Se não solicitou esta alteração, entre em contato com a administração do sistema imediatamente.</p>
              <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">
              <p style="font-size: 12px; color: #6B7280;">PDL1</p>
            </div>
          `,
        });

        return res.send({
          message: "Password gerada e enviada por email com sucesso!",
        });
      }

      res.send({
        message: "Password gerada com sucesso!",
        password: newPassword,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Erro ao gerar password", error: err });
    }
  }
);

// listar responsáveis de um hospital com submissions e items
router.get(
  "/readByHospital",
  requireRole("admin", "adminHospital", "repHospitalar"),
  requireOwnHospital((req) => req.query.hospital_id),
  async (req, res) => {
    const hospitalId = req.query.hospital_id;

    if (!hospitalId) {
      return res.status(400).send({ message: "hospital_id é obrigatório" });
    }

    try {
      const [hospital] = await query("SELECT * from hospitals WHERE id = ?", [
        hospitalId,
      ]);

      if (!hospital) {
        return res.status(404).send({ message: "Hospital não encontrado" });
      }

      const responsaveis = await query(
        "SELECT id, nome, email, cargo, telefone, hospital_id, role, is_admin, created_at, updated_at FROM login WHERE hospital_id = ? AND role IN ('adminHospital', 'repHospitalar')",
        [hospitalId]
      );

      if (responsaveis.length === 0) {
        return res.send({ hospital, responsaveis: [] });
      }

      const responsavelIds = responsaveis.map((r) => r.id);

      const submissions = await query(
        `SELECT * FROM submissions
         WHERE login_id IN (?)`,
        [responsavelIds]
      );

      const submissionIds = submissions.map((s) => s.id);

      let submissionItems = [];

      if (submissionIds.length > 0) {
        submissionItems = await query(
          `SELECT * FROM submission_items
           WHERE submission_id IN (?)`,
          [submissionIds]
        );
      }

      const submissionsMap = {};
      const itemsMap = {};

      submissionItems.forEach((item) => {
        if (!itemsMap[item.submission_id]) {
          itemsMap[item.submission_id] = [];
        }
        itemsMap[item.submission_id].push(item);
      });

      submissions.forEach((sub) => {
        sub.items = itemsMap[sub.id] || [];

        if (!submissionsMap[sub.login_id]) {
          submissionsMap[sub.login_id] = [];
        }

        submissionsMap[sub.login_id].push(sub);
      });

      const responsaveisComSubmissoes = responsaveis.map((resp) => ({
        ...resp,
        submissions: submissionsMap[resp.id] || [],
      }));

      res.send({
        hospital,
        responsaveis: responsaveisComSubmissoes,
      });
    } catch (e) {
      console.error(e);
      res.status(500).send({ message: "Erro no servidor", error: e });
    }
  }
);

router.get(
  "/readById",
  requireRole("admin", "adminHospital"),
  requireOwnHospital((req) => hospitalIdOfLogin(req.query.id)),
  async (req, res) => {
    try {
      const rows = await query(
        "SELECT id, nome, email, cargo, telefone, hospital_id, role FROM login WHERE role IN ('adminHospital', 'repHospitalar') AND id = ?",
        [req.query.id]
      );

      if (!rows.length) {
        return res.status(404).send({ message: "representante não encontrado" });
      }

      res.send(rows[0]);
    } catch (e) {
      console.log(e);
      res.status(500).send({ message: "Erro no servidor", error: e });
    }
  }
);

const ASSIGNABLE_ROLES = ["adminHospital", "repHospitalar"];

// criar utilizador de hospital (role escolhida no formulário: Admin ou Representante)
router.post("/create", requireRole("admin", "adminHospital"), async (req, res) => {
  try {
    const data = req.body.data;

    const hospitalId =
      req.user.role === "adminHospital" ? req.user.hospital_id : data.hospital_id;

    const hospitalExists = await query(
      "SELECT id from hospitals WHERE id = ?",
      [hospitalId]
    );
    if (!hospitalExists.length) {
      return res.status(400).send({ message: "Hospital não existe" });
    }

    const emailExists = await query("SELECT id FROM login WHERE email = ?", [
      data.email,
    ]);
    if (emailExists.length) {
      return res.status(400).send({ message: "Email já está em uso" });
    }

    if (!ASSIGNABLE_ROLES.includes(data.role)) {
      return res.status(400).send({ message: "Role inválida" });
    }

    const payload = {
      nome: data.nome,
      email: data.email,
      cargo: data.cargo || null,
      telefone: data.telefone || null,
      hospital_id: hospitalId,
      role: data.role,
      is_admin: 0,
      created_by: req.user.id,
    };

    const result = await query("INSERT INTO login SET ?", payload);
    res.send(result);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

// atualizar representante
router.post(
  "/update",
  requireRole("admin", "adminHospital"),
  requireOwnHospital((req) => hospitalIdOfLogin(req.body.data.id)),
  async (req, res) => {
    try {
      const data = req.body.data;
      const id = data.id;

      if (data.role !== undefined && !ASSIGNABLE_ROLES.includes(data.role)) {
        return res.status(400).send({ message: "Role inválida" });
      }

      const allowedFields = [
        "nome",
        "email",
        "cargo",
        "telefone",
        "avatar",
        "role",
      ];
      const payload = {};
      allowedFields.forEach((field) => {
        if (data[field] !== undefined) payload[field] = data[field];
      });

      const columns = Object.keys(payload);
      const values = Object.values(payload);

      if (!columns.length) {
        return res.send({ message: "Nada para atualizar" });
      }

      const result = await query(
        "UPDATE login SET " + columns.join(" = ?, ") + " = ? WHERE ID = ?",
        [...values, id]
      );
      res.send(result);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);

// apagar representante
router.post(
  "/delete",
  requireRole("admin", "adminHospital"),
  requireOwnHospital((req) => hospitalIdOfLogin(req.body.id)),
  async (req, res) => {
    try {
      const result = await query("DELETE FROM login WHERE ID = ?", [req.body.id]);
      res.send(result);
    } catch (e) {
      if (e.code === "ER_ROW_IS_REFERENCED_2" || e.code === "ER_ROW_IS_REFERENCED") {
        return res.status(400).send({
          message: "Este utilizador tem submissões associadas e não pode ser eliminado.",
        });
      }
      res.status(500).send(e);
    }
  }
);

module.exports = router;
