const mysql = require("mysql");
const PORT = process.env.PORT || 3306;

const db = mysql.createPool({
  host: "185.118.114.199",
  database: "phormuladev_europeer_old",
  user: "phormuladev_europeer_user",
  password: "K}CKRFCOc%M#qble",
  port: PORT,
  multipleStatements: true,
});

const dbNew = mysql.createPool({
  host: "127.0.0.1",
  database: "pdl1",
  user: "root",
  password: "",
  port: 3313,
  multipleStatements: true,
});

module.exports = dbNew;
