require("dotenv").config();

const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const dayjs = require("dayjs");
const express = require("express");
const util = require("util");
const mysql = require("mysql");
const middleware = require("./utils/middleware");

const db = require("./utils/database");
const authRouter = require("./routes/auth");
const logsRouter = require("./routes/logs");
const userRouter = require("./routes/user");
const submissionHerRouter = require("./routes/submissionHer");
const paramsHerRouter = require("./routes/paramsHer");
const hospitalRouter = require("./routes/hospital");
const repHospitalRouter = require("./routes/repHospital");
const statisticsRouter = require("./routes/statistics");
const processRouter = require("./routes/process");
const adminRouter = require("./routes/admin");
const dataManagementRouter = require("./routes/dataManagement");
const biomarkersRouter = require("./routes/biomarkers");
const publicStatsRouter = require("./routes/publicStats");

const app = express();
const port = process.env.PORT || 4001;

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(compression());

// Limitação de taxa para evitar abusos
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutos
  max: 600,
});

//app.use(limiter);

app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

let server = app.listen(port, () => {
  console.log(`---------- STARTING SERVER ----------`);
  console.log(`${dayjs().format("YYYY-MM-DD HH:mm:ss")}`);
  console.log(`Server running at ${port}`);
  console.log(`--------------------`);
});

db.getConnection((error, conn) => {
  console.log(`---------- CONNECTING TO DB ----------`);
  if (error) {
    throw error;
  } else {
    console.log("MySQL database is connected successfully");
    console.log(`--------------------`);
    conn.release();
  }
});

app.use("/media", express.static("media"));

app.get("/", (req, res) => {
  res.end("EUROPEER API!");
});

app.use("/auth", authRouter);
app.use("/logs", middleware, logsRouter);
app.use("/user", userRouter);
app.use("/submissionHer", middleware, submissionHerRouter);
app.use("/processHer", middleware, processRouter);
app.use("/hospital", middleware, hospitalRouter);
app.use("/repHospital", middleware, repHospitalRouter);
app.use("/statistics", middleware, statisticsRouter);
app.use("/admin", middleware, adminRouter);
app.use("/paramsHer", middleware, paramsHerRouter);
app.use("/dataManagement", middleware, dataManagementRouter);
app.use("/biomarkers", middleware, biomarkersRouter);
app.use("/publicStats", publicStatsRouter);

const dbNew = mysql.createPool({
  host: "185.118.114.199",
  database: "phormuladev_europeer",
  user: "phormuladev_europeer_user",
  password: "K}CKRFCOc%M#qble",
  port: 3306,
  multipleStatements: true,
});

module.exports = app;
