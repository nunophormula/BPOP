var express = require("express");
var router = express.Router();
var util = require("util");
var db = require("../utils/database");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { requireRole } = require("../utils/authorize");

const query = util.promisify(db.query).bind(db);

router.use(requireRole("admin"));

router.post("/generatePassword", async (req, res) => {
  const { respId, sendEmail } = req.body;

  if (!respId)
    return res.status(400).send({ message: "Parâmetro respId é obrigatório" });

  try {
    const [resp] = await query("SELECT * FROM login WHERE id = ?", [respId]);
    if (!resp)
      return res.status(404).send({ message: "administrador não encontrado" });

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
});

// listar responsáveis de um hospital
router.get("/readByHospital", async (req, res) => {
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
      "SELECT * FROM login WHERE hospital_id = ?",
      [hospitalId]
    );

    res.send({
      hospital,
      responsaveis,
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Erro no servidor", error: e });
  }
});

router.get("/readById", async (req, res) => {
  try {
    const rows = await query(
      "SELECT id, nome, email, cargo, telefone, hospital_id FROM login WHERE id = ?",
      [req.query.id]
    );

    if (!rows.length) {
      return res.status(404).send({ message: "administrador não encontrado" });
    }

    res.send(rows[0]);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Erro no servidor", error: e });
  }
});

router.get("/read", async (req, res) => {
  try {
    const admins = await query("SELECT * FROM login WHERE role = 'admin'");

    if (!admins.length) {
      return res.status(404).send({ message: "administrador não encontrado" });
    }

    res.send({ admins });
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Erro no servidor", error: e });
  }
});

// criar administrador
router.post("/create", async (req, res) => {
  try {
    const data = req.body.data;

    const emailExists = await query("SELECT id FROM login WHERE email = ?", [
      data.email,
    ]);
    if (emailExists.length) {
      return res.status(400).send({ message: "Email já está em uso" });
    }

    const payload = {
      nome: data.nome,
      email: data.email,
      cargo: data.cargo || null,
      telefone: data.telefone || null,
      role: "admin",
      is_admin: 1,
      hospital_id: null,
      created_by: req.user.id,
    };

    const result = await query("INSERT INTO login SET ?", payload);
    res.send(result);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

// atualizar administrador
router.post("/update", async (req, res) => {
  try {
    const data = req.body.data;
    const id = data.id;

    const allowedFields = ["nome", "email", "cargo", "telefone", "avatar"];
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
});

// apagar administrador
router.post("/delete", async (req, res) => {
  try {
    const result = await query("DELETE FROM login WHERE ID = ?", [req.body.id]);
    res.send(result);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
