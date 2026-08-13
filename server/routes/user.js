var express = require("express");
var dayjs = require("dayjs");
var util = require("util");
var fileUpload = require("express-fileupload");
const bcrypt = require("bcryptjs");
var router = express.Router();

var db = require("../utils/database");
const { createToken } = require("../utils/token");

const saltRounds = 10;
router.use(fileUpload());

router.use((req, res, next) => {
  console.log("---------------------------");
  console.log(req.url, "@", dayjs().format("YYYY-MM-DD HH:mm:ss"));
  console.log("---------------------------");
  next();
});

router.get("/read", async (req, res) => {
  const query = util.promisify(db.query).bind(db);
  try {
    const rows = await query("SELECT * FROM user");
    res.send(rows);
  } catch (e) {
    throw e;
  }
});

router.get("/readByEmail", async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);
    const rows = await query("SELECT * FROM user WHERE email = ?", req.query.email);
    res.send(rows);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.get("/readById", async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);
    const rows = await query(`SELECT * FROM user WHERE id = ${req.query.id}`);
    res.send(rows);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.post("/generatePassword", async (req, res, next) => {
  try {
    let data = req.body.data;
    const query = util.promisify(db.query).bind(db);
    const updatedRow = await query("UPDATE user SET generate_password = 1 WHERE id = ?", data.id);
    //await email.generatePassword([data]);
    res.send(updatedRow);
  } catch (err) {
    throw err;
  }
});

router.post("/create", async (req, res, next) => {
  console.log("//// CREATE USER ////");
  try {
    const query = util.promisify(db.query).bind(db);
    const data = req.body.data;
    const insertedRow = await query("INSERT INTO user SET ?", data);
    res.send(insertedRow);
  } catch (err) {
    throw err;
  }
});

router.post("/update", async (req, res, next) => {
  try {
    let data = req.body.data;
    let whereId = data.id;
    delete data.id;

    if (data.new_password) {
      data.password = await bcrypt.hash(data.new_password, saltRounds);
      delete data.new_password;
      delete data.confirm_new_password;
    }

    const columns = Object.keys(data);
    const values = Object.values(data);

    const query = util.promisify(db.query).bind(db);
    await query("UPDATE user SET " + columns.join(" = ?, ") + " = ? WHERE id = " + whereId, values);
    let user = await query("SELECT * FROM user WHERE id = ?", whereId);

    let newToken = await createToken(user[0]);
    res.send({ user: user[0], token: newToken });
  } catch (err) {
    throw err;
  }
});

router.post("/delete", async (req, res, next) => {
  try {
    const query = util.promisify(db.query).bind(db);
    let id_user = req.body.data.id_user;
    const deletedRow = await query("DELETE FROM user WHERE id = " + id_user);
    res.send(deletedRow);
  } catch (err) {
    throw err;
  }
});

module.exports = router;
