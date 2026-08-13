const fs = require("fs");
const express = require("express");
const multer = require("multer");
const PDFParser = require("pdf2json");
var util = require("util");

const upload = multer({ dest: "uploads/" });
const router = express.Router();

var db = require("../utils/database");

router.get("/read", async (req, res) => {
  try {
    const query = util.promisify(db.query).bind(db);

    const submissions = await query(`
      SELECT 
        s.*,
        l.nome AS login_nome,
        l.avatar AS login_avatar,
        h.id AS hospital_id,
        h.nome AS hospital_nome
      FROM submissions s
      JOIN login l ON s.login_id = l.id
      JOIN hospitals h ON l.hospital_id = h.id
    `);

    if (!submissions.length) {
      return res.status(404).send({ message: "Nenhuma submission encontrada" });
    }

    const submissionIds = submissions.map((s) => s.id);
    const items = await query(
      `SELECT * FROM submission_items WHERE submission_id IN (?)`,
      [submissionIds]
    );

    const itemsGrouped = items.reduce((acc, item) => {
      if (!acc[item.submission_id]) acc[item.submission_id] = [];
      acc[item.submission_id].push(item);
      return acc;
    }, {});

    const submissionsWithItems = submissions.map((sub) => ({
      ...sub,
      items: itemsGrouped[sub.id] || [],
    }));

    res.send(submissionsWithItems);
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: "Erro no servidor", error: e });
  }
});

router.post("/readPDF", upload.single("pdf"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "PDF não enviado" });

  const pdfPath = req.file.path;
  const pdfParser = new PDFParser();

  /* helpers */
  function normalizeHyphens(text) {
    if (!text) return text;

    return (
      text
        // normaliza tipos diferentes de hífen
        .replace(/[‐-–—]/g, "-")
        // remove espaços à volta do hífen
        .replace(/\s*-\s*/g, "-")
        // corrige letras separadas por hífen + espaço
        .replace(/([a-zA-ZÀ-ÿ])-\s+([a-zA-ZÀ-ÿ])/g, "$1-$2")
    );
  }

  function safeDecode(text) {
    try {
      return decodeURIComponent(text);
    } catch {
      return text;
    }
  }
  function groupByLine(texts) {
    const lines = {};
    texts.forEach((t) => {
      const y = t.y.toFixed(1);
      if (!lines[y]) lines[y] = [];
      lines[y].push(t);
    });
    return Object.values(lines).map((l) => l.sort((a, b) => a.x - b.x));
  }
  function getYofTitle(title, allTexts) {
    const match = allTexts.find(
      (t) => t.text === title.text && t.page === title.page
    );
    return match ? match.y : 0;
  }
  /* -------- verifica se é table -------- */
  function parseTable(lines) {
    if (!Array.isArray(lines) || lines.length < 2) return null;

    const headerIndex = lines.findIndex((l) => /\s{2,}/.test(l.text));
    if (headerIndex === -1) return null;

    const headers = lines[headerIndex].text.trim().split(/\s{2,}/);
    const rows = [];

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const cols = lines[i].text.trim().split(/\s{2,}/);
      if (cols.length < 2) break;

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] || "";
      });

      if (Object.values(row).some((v) => v)) rows.push(row);
      else break;
    }

    return rows.length ? rows : null;
  }
  /* faz a verificação de quebra de linha e verifica se a frase terminou. */
  function mergeLines(lines) {
    if (!lines || !lines.length) return [];

    const merged = [];
    let buffer = normalizeHyphens(lines[0].text);

    for (let i = 1; i < lines.length; i++) {
      const prevEnd = buffer.trim().slice(-1);
      const next = normalizeHyphens(lines[i].text.trim());

      const startsWithBullet = next.startsWith("*") || next.startsWith("-");
      const nextStartsUpper = next[0] === next[0].toUpperCase();

      if (startsWithBullet) {
        buffer += "<br/>" + next;
        continue;
      }

      if ([".", "!", "?", ":"].includes(prevEnd) || nextStartsUpper) {
        merged.push({ text: buffer, level: "text" });
        buffer = next;
      } else {
        buffer += " " + next;
      }
    }

    merged.push({ text: buffer, level: "text" });
    return merged;
  }

  /* verifica titulos dependendo da sua indentação comparando um a um */
  function nestTitlesByIndentation(titles) {
    const result = [];

    for (let i = 0; i < titles.length; i++) {
      const current = titles[i];
      const prev = result[result.length - 1];

      current.contentInside = current.contentInside || [];

      if (!prev) {
        current.level = "title";
        result.push(current);
        continue;
      }

      if (current.x > prev.x) {
        current.level = "subtitle";
        prev.contentInside.push(current);
      } else {
        current.level = "title";
        result.push(current);
      }
    }

    return result;
  }

  /* parse do pdf */
  pdfParser.on("pdfParser_dataReady", (pdfData) => {
    try {
      const rawTitles = [];
      const allTexts = [];

      pdfData.Pages.forEach((page, pageIndex) => {
        const lines = groupByLine(page.Texts)
          .sort((a, b) => a[0].y - b[0].y)
          .slice(2, -2);

        lines.forEach((line) => {
          let text = line
            .map((t) => t.R.map((r) => safeDecode(r.T)).join(""))
            .join(" ")
            .trim();

          text = normalizeHyphens(text);

          if (!text) return;

          const ts = line[0].R[0].TS;
          const fontSize = ts?.[1];
          const isBold = ts?.[2] === 1;
          const y = line[0].y;
          const x = line[0].x;

          allTexts.push({ text, page: pageIndex + 1, y, x, isBold });

          if (isBold && fontSize >= 14) {
            rawTitles.push({
              text,
              page: pageIndex + 1,
              fontSize,
              x,
              level: "title",
              contentInside: [],
            });
          }
        });
      });

      // conteúdo interno + tabelas
      rawTitles.forEach((title, index) => {
        const nextTitle = rawTitles[index + 1];

        const insideItems = allTexts.filter((item) => {
          if (item.text === title.text && item.page === title.page)
            return false;

          const after =
            item.page > title.page ||
            (item.page === title.page && item.y > getYofTitle(title, allTexts));

          const beforeNext = !nextTitle
            ? true
            : item.page < nextTitle.page ||
              (item.page === nextTitle.page &&
                item.y < getYofTitle(nextTitle, allTexts));

          return after && beforeNext;
        });

        let buffer = [];

        insideItems.forEach((item, i) => {
          if (item.isBold) {
            if (buffer.length) {
              const table = parseTable(buffer);
              if (table) {
                title.contentInside.push({ level: "table", rows: table });
              } else {
                title.contentInside.push(...mergeLines(buffer));
              }
              buffer = [];
            }

            title.contentInside.push({
              text: item.text,
              x: item.x,
              level: "subtitle",
              contentInside: [],
            });
          } else {
            buffer.push({ text: item.text });
          }

          if (!insideItems[i + 1] || insideItems[i + 1].isBold) {
            if (buffer.length) {
              const table = parseTable(buffer);
              if (table) {
                title.contentInside.push({ level: "table", rows: table });
              } else {
                title.contentInside.push(...mergeLines(buffer));
              }
              buffer = [];
            }
          }
        });
      });

      // estrutura final a partir da indentação
      const structuredTitles = nestTitlesByIndentation(rawTitles);

      fs.unlinkSync(pdfPath);
      return res.json({ success: true, titles: structuredTitles });
    } catch (err) {
      fs.unlinkSync(pdfPath);
      return res.status(500).json({
        error: "Erro ao processar PDF",
        details: err.message,
      });
    }
  });

  pdfParser.on("pdfParser_dataError", (err) => {
    fs.unlinkSync(pdfPath);
    return res.status(500).json({
      error: "Erro ao ler PDF",
      details: err.parserError,
    });
  });

  pdfParser.loadPDF(pdfPath);
});

async function createDefaultPatient(query) {
  const processNumber = `PDL-${Date.now()}`;

  const result = await query(
    `INSERT INTO PATIENTS (INSTITUTION, patient, ACRONYMS_NAME)
     VALUES (?, ?, ?)`,
    [null, processNumber, "SEM_IDENTIFICACAO"]
  );

  return result.insertId;
}

function pdfToItems(pdfNodes) {
  return pdfNodes
    .filter((node) => node.level === "title")
    .map((titleNode) => ({
      TITLE: titleNode.text,
      CONTENT: titleNode.contentInside || [],
    }));
}

router.post("/create", async (req, res) => {
  const { pdfData, loginId, type, patient } = req.body;

  if (!pdfData || !Array.isArray(pdfData)) {
    return res.status(400).json({
      error: "pdfData é obrigatório e deve ser um array",
    });
  }

  if (!loginId) {
    return res.status(400).json({
      error: "loginId é obrigatório",
    });
  }

  const query = util.promisify(db.query).bind(db);

  try {
    let finalProcessNumber;
    let isNewProcess = false;

    if (patient) {
      finalProcessNumber = patient;
    } else {
      finalProcessNumber = `PDL-${Date.now()}`;
      isNewProcess = true;
    }

    const submissionResult = await query(
      `INSERT INTO submissions (login_id, type, patient)
       VALUES (?, ?, ?)`,
      [loginId, type || "PDF", finalProcessNumber]
    );

    const submissionId = submissionResult.insertId;

    const items = pdfToItems(pdfData);

    for (const item of items) {
      await query(
        `INSERT INTO submission_items (submission_id, item_data)
         VALUES (?, ?)`,
        [submissionId, JSON.stringify(item)]
      );
    }

    return res.status(201).json({
      success: true,
      submissionId,
      loginId,
      processNumber: finalProcessNumber,
      createdNewProcess: isNewProcess,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Erro ao guardar submissão",
      details: err.message,
    });
  }
});

module.exports = router;
