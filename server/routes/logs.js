var express = require("express");
var dayjs = require("dayjs");
var util = require("util");
var router = express.Router();
var db = require("../utils/database");
const { requireRole, requireOwnHospital } = require("../utils/authorize");

router.use((req, res, next) => {
  console.log("---------------------------");
  console.log(req.url, "@", dayjs().format("YYYY-MM-DD HH:mm:ss"));
  console.log("---------------------------");
  next();
});

const SELECT_LOGS = `
  SELECT logs.*, hospitals.nome AS hospital_nome
  FROM logs
  LEFT JOIN hospitals ON hospitals.id = logs.hospital_id
`;

router.get("/read", requireRole("admin"), async (req, res) => {
  const query = util.promisify(db.query).bind(db);
  try {
    const rows = await query(`${SELECT_LOGS} ORDER BY logs.created_at DESC`);
    res.send(rows);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.get(
  "/readByHospital",
  requireRole("admin", "adminHospital"),
  requireOwnHospital((req) => req.query.hospital_id),
  async (req, res) => {
    const query = util.promisify(db.query).bind(db);
    try {
      const rows = await query(
        `${SELECT_LOGS} WHERE logs.hospital_id = ? ORDER BY logs.created_at DESC`,
        [req.query.hospital_id]
      );
      res.send(rows);
    } catch (e) {
      console.log(e);
      res.status(500).send({ message: "Some error on server.", error: e });
    }
  }
);

router.post("/create", async (req, res) => {
  console.log("---- CREATE USER LOG ----");
  const query = util.promisify(db.query).bind(db);
  try {
    const { action } = req.body.data || {};
    const rows = await query("INSERT INTO logs SET ?", {
      user_id: req.user.id,
      user_name: req.user.nome,
      user_email: req.user.email,
      role: req.user.role,
      hospital_id: req.user.hospital_id,
      action: action || "logout",
    });
    res.send(rows);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

module.exports = router;
