var express = require("express");
var dayjs = require("dayjs");
var util = require("util");
var router = express.Router();

var db = require("../utils/database");

router.use((req, res, next) => {
  console.log("---------------------------");
  console.log(req.url, "@", dayjs().format("YYYY-MM-DD HH:mm:ss"));
  console.log("---------------------------");
  next();
});

router.get("/read", async (req, res) => {
  console.log("//// READ ICD10 ////");
  const query = util.promisify(db.query).bind(db);
  try {
    const rows = await query("SELECT * FROM ICD10");
    res.send(rows);
  } catch (e) {
    throw e;
  }
});

router.get("/readByFilter", async (req, res) => {
  console.log("//// READ ICD10 BY FILTER ////");
  const query = util.promisify(db.query).bind(db);
  try {
    const rows = await query(`SELECT * FROM ICD10 WHERE DESCRICAO1 LIKE '%${req.query.diagnosis}%' OR DESCRICAO2 LIKE '%${req.query.diagnosis}'`);
    res.send(rows);
  } catch (e) {
    throw e;
  }
});

router.post("/create", async (req, res, next) => {
  console.log("//// CREATE ICD10 ////");
  try {
    const query = util.promisify(db.query).bind(db);
    const data = req.body.data;
    const insertedRow = await query("INSERT INTO ICD10 SET ?", data);
    res.send(insertedRow);
  } catch (err) {
    throw err;
  }
});

router.post("/update", async (req, res, next) => {
  console.log("//// UPDATE ICD10 ////");
  try {
    let data = req.body.data;
    let whereId = data.id;
    delete data.id;

    const columns = Object.keys(data);
    const values = Object.values(data);

    const query = util.promisify(db.query).bind(db);
    const updatedRow = await query("UPDATE ICD10 SET " + columns.join(" = ?, ") + " = ? WHERE id = " + whereId, values);
    res.send(updatedRow);
  } catch (err) {
    throw err;
  }
});

router.post("/delete", async (req, res, next) => {
  console.log("//// DELETE ICD10 ////");
  try {
    const query = util.promisify(db.query).bind(db);
    let id_user = req.body.data.id_user;
    const deletedRow = await query("DELETE FROM ICD10 WHERE ID = " + id_user);
    res.send(deletedRow);
  } catch (err) {
    throw err;
  }
});

module.exports = router;
