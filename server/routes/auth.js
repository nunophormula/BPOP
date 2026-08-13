var express = require("express");
var dayjs = require("dayjs");
var router = express.Router();
const util = require("util");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const uploadAvatar = require("../utils/uploadAvatar");

var db = require("../utils/database");
const { verifyToken, createToken, createRecoverPasswordToken } = require("../utils/token");
const { logEvent } = require("../utils/auditLog");

const saltRounds = 10;

router.use((req, res, next) => {
  console.log("---------------------------");
  console.log(req.url, "@", dayjs().format("YYYY-MM-DD HH:mm:ss"));
  console.log("---------------------------");
  next();
});

router.get("/encryptPasswod", async (req, res, next) => {
  try {
    res.send({ password: await bcrypt.hash(req.query.password, saltRounds) });
  } catch (err) {
    throw err;
  }
});

router.post("/verifyToken", async (req, res, next) => {
  console.log("///// VERIFY TOKEN /////");
  try {
    let token = req.body.data;
    const result = await verifyToken(token);
    if (result.token_valid) {
      const query = util.promisify(db.query).bind(db);
      const user = await query("SELECT * FROM login WHERE ID = ?", result.token_decoded.id);
      if (user.length > 0) {
        if (user[0].loginu === result.token_decoded.loginu && user[0].password === result.token_decoded.password) {
          const newToken = await createToken(user[0]);
          console.log("TOKEN IS VALID");
          res.send({ token: newToken, token_valid: true, user: user[0] });
        } else {
          console.log("TOKEN IS NOT VALID");
          res.send({ token_valid: false });
        }
      } else {
        res.send({ token_valid: false });
      }
    } else {
      return res.status(401).send("Invalid Token");
    }
  } catch (err) {
    throw err;
  }
});

router.post("/verifyTokenGeneratePassword", async (req, res, next) => {
  console.log("///// VERIFY TOKEN GENERATE PASSWORD /////");
  try {
    let token = req.body.data;
    const result = await verifyToken(token);
    if (result.token_valid) {
      const query = util.promisify(db.query).bind(db);
      const user = await query("SELECT * FROM user WHERE user.email = ?", result.token_decoded.email);
      if (user.length > 0 && user[0].email === result.token_decoded.email && (!user[0].password || user[0].generate_password)) {
        console.log("TOKEN IS VALID");
        res.send({ token_valid: true, user: user[0] });
      } else {
        res.send({ token_valid: false });
      }
    } else {
      res.send({ token_valid: false });
    }
  } catch (err) {
    throw err;
  }
});

router.post("/generatePassword", async (req, res, next) => {
  console.log("///// GENERATE PASSWORD /////");
  try {
    let data = req.body.data;
    const query = util.promisify(db.query).bind(db);
    const password = await bcrypt.hash(data.password, saltRounds);
    await query("UPDATE user SET password = ?, generate_password = 0 WHERE email = ?", [password, data.email]);
    res.send({ updated: true });
    conn.release();
  } catch (err) {
    throw err;
  }
});

router.post("/login", async (req, res, next) => {
  console.log("///// LOGIN /////");
  try {
    const query = util.promisify(db.query).bind(db);
    let data = req.body.data;
    const user = await query("SELECT * FROM login WHERE email = ?", [data.username]);
    if (user.length > 0) {
      const comparePassword = await bcrypt.compare(data.password, user[0].password);
      if (comparePassword) {
        let jwtToken = await createToken(user[0]);
        logEvent(query, { user: user[0], action: "login_success" });
        res.send({ user: user[0], token: jwtToken });
      } else {
        logEvent(query, { user: user[0], action: "login_failed" });
        res.send({ user: null, message: "A password está incorreta, tente novamente!" });
      }
    } else {
      logEvent(query, { user: { email: data.username }, action: "login_failed" });
      res.send({ user: null, message: "Este utilizador não existe na nossa base de dados!" });
    }
  } catch (err) {
    console.log(data.username);
    console.log(err);
    throw err;
  }
});

router.post("/recover", async (req, res, next) => {
  console.log("///// RECOVER PASSWORD E-MAIL /////");
  try {
    const query = util.promisify(db.query).bind(db);
    let data = req.body.data;
    const user = await query("SELECT * FROM user WHERE email = ?", data.email);
    if (user.length > 0) {
      const token = await createRecoverPasswordToken(data);
      res.send({ user: true });
    } else {
      res.send({ user: false, message: "This e-mails is not registered on our database!" });
    }
  } catch (err) {
    throw err;
  }
});

router.post("/recoverPassword", async (req, res, next) => {
  console.log("///// RECOVER PASSWORD /////");
  let data = req.body.data;
  try {
    const query = util.promisify(db.query).bind(db);
    const token = await verifyToken(req.body.data.token);

    if (token.token_valid) {
      let cryptedPassword = await bcrypt.hash(req.body.data.password, saltRounds);
      const updatedRow = await query("UPDATE user SET password = ? WHERE email = ?", [cryptedPassword, token.token_decoded.email]);
      if (updatedRow.affectedRows === 1) {
        res.send({ updated: true });
      } else {
        res.send({ updated: false, message: "Something wrong happened, please verify if the link is the correct one." });
      }
    } else {
      res.send({ user: false, message: "Your time to recover password has expired, you'll need to make the process again." });
    }
  } catch (err) {
    throw err;
  }
});


router.post("/update", uploadAvatar.single("avatar"), async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);
    const { id, ...body } = req.body;

    console.log(req.body);

    if (!id) return res.status(400).send({ updated: false, message: "ID obrigatório" });

    // Campos permitidos
    const allowedFields = ["nome", "email", "password", "cargo", "telefone"];
    const fields = [];
    const values = [];

    allowedFields.forEach(field => {
      if (body[field] !== undefined && body[field] !== "") {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    });

    if (req.file) {
      try {
        const oldAvatarRow = await query("SELECT avatar FROM login WHERE id = ?", [id]);
        if (oldAvatarRow.length && oldAvatarRow[0].avatar) {
          const oldPath = path.join(__dirname, "../", oldAvatarRow[0].avatar);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch (err) {
        console.warn("Não foi possível remover avatar antigo:", err.message);
      }

      fields.push("avatar = ?");
      values.push(`/uploads/avatars/${req.file.filename}`);
    }

    if (fields.length === 0) return res.send({ updated: false, message: "Nada para atualizar" });

    values.push(id);

    const sql = `UPDATE login SET ${fields.join(", ")} WHERE id = ?`;
    const result = await query(sql, values);
    if (result.affectedRows === 1) {
      const [updatedUser] = await query("SELECT * FROM login WHERE id = ?", [id]);
      return res.send({ updated: true, user: updatedUser });
    }
    return res.send({ updated: false, message: "Utilizador não encontrado" });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ updated: false, message: "Erro ao atualizar utilizador" });
  }
});

router.post("/forgotPassword", async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({
        success: false,
        message: "Email obrigatório",
      });
    }

    const users = await query(
      "SELECT id FROM login WHERE email = ?",
      [email]
    );

    if (!users.length) {
      return res.send({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); 

    await query(
      "UPDATE login SET token = ?, expires_at = ? WHERE email = ?",
      [token, expiresAt, email]
    );

    console.log(email);
    console.log(token);

    const resetLink = `http://localhost:5173/resetPassword?token=${token}`;

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
      from: `"PDL1" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Recuperação de password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #1F2937;">Olá,</h2>

          <p>
            Recebemos um pedido para redefinir a password da sua conta na plataforma
            <strong>PD-L1 & HER-2</strong>.
          </p>

          <p>
            Para criar uma nova password, clique no botão abaixo:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a
              href="${resetLink}"
              style="
                background-color: #2563EB;
                color: #ffffff;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                display: inline-block;
              "
            >
              Redefinir password
            </a>
          </div>

          <p>
            Este link é válido por <strong>1 hora</strong>.
          </p>

          <p>
            Se não solicitou esta alteração, pode ignorar este email com segurança.
          </p>

          <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;">

          <p style="font-size: 12px; color: #6B7280;">
            Este é um email automático. Por favor, não responda.<br />
            <strong>PDL1</strong>
          </p>
        </div>
      `,
    });


    return res.send({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      success: false,
      message: "Erro ao processar recuperação de password",
    });
  }
});

router.post("/resetPassword", async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).send({
        success: false,
        message: "Token e password são obrigatórios",
      });
    }

    const users = await query(
      "SELECT id, expires_at FROM login WHERE token = ?",
      [token]
    );

    if (
      !users.length ||
      !users[0].expires_at ||
      new Date(users[0].expires_at) < new Date()
    ) {
      return res.status(400).send({
        success: false,
        message: "Token inválido ou expirado",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
      `UPDATE login
       SET password = ?, token = NULL, expires_at = NULL
       WHERE id = ?`,
      [hashedPassword, users[0].id]
    );

    return res.send({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      success: false,
      message: "Erro ao redefinir password",
    });
  }
});

router.post("/createAdmin", async (req, res) => {
  console.log("///// CREATE ADMIN /////");
  try {
    const query = util.promisify(db.query).bind(db);
    const { nome, email, password, cargo, telefone } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).send({
        success: false,
        message: "Nome, email e password são obrigatórios",
      });
    }

    // Verificar se já existe utilizador com o mesmo email
    const existingUser = await query(
      "SELECT id FROM login WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).send({
        success: false,
        message: "Já existe um utilizador com este email",
      });
    }

    // Encriptar password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Criar admin
    const result = await query(
      `INSERT INTO login 
        (nome, email, password, cargo, telefone, is_admin)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        nome,
        email,
        hashedPassword,
        cargo || "Administrador",
        telefone || null,
        1, // is_admin
      ]
    );

    if (result.insertId) {
      const [admin] = await query(
        "SELECT * FROM login WHERE id = ?",
        [result.insertId]
      );

      return res.send({
        success: true,
        admin,
      });
    }

    return res.status(500).send({
      success: false,
      message: "Erro ao criar admin",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send({
      success: false,
      message: "Erro interno ao criar admin",
    });
  }
});

module.exports = router;
