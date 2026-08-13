var express = require("express");
var dayjs = require("dayjs");
var util = require("util");
var router = express.Router();

var db = require("../utils/database");
const { requireRole, requireOwnHospital } = require("../utils/authorize");

const query = util.promisify(db.query).bind(db);

router.use((req, res, next) => {
  console.log("---------------------------");
  console.log(req.url, "@", dayjs().format("YYYY-MM-DD HH:mm:ss"));
  console.log("---------------------------");
  next();
});

async function hospitalIdOfTechnical(id) {
  const [row] = await query("SELECT hospital_id FROM hospital_technical WHERE id = ?", [id]);
  return row?.hospital_id;
}

router.get("/read", requireRole("admin"), async (req, res) => {
  console.log("//// READ HOSPITAIS + RESP_HOSPITALARES (SEPARADOS) ////");

  try {
    const hospitais = await query(`
      SELECT
        h.*,
        (
          SELECT COUNT(*)
          FROM submissions s
          WHERE s.hospital_id = h.id
        ) AS total_submissoes
      FROM hospitals h
      ORDER BY h.nome
    `);

    const resp_hospitalares = await query(`
      SELECT
        *
      FROM login
      WHERE role IN ('adminHospital', 'repHospitalar')
      ORDER BY nome
    `);

    res.send({
      hospitais,
      resp_hospitalares,
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({
      message: "Some error on server.",
      error: e,
    });
  }
});

router.get(
  "/readById",
  requireOwnHospital((req) => req.query.id),
  async (req, res) => {
    console.log("//// READ hospitais BY ID ////");
    try {
      const rows = await query("SELECT * from hospitals WHERE id = ?", [
        req.query.id,
      ]);
      res.send(rows);
    } catch (e) {
      console.log(e);
      res.status(500).send({ message: "Some error on server.", error: e });
    }
  }
);

router.post("/create", requireRole("admin"), async (req, res) => {
  console.log("//// CREATE hospitais ////");
  try {
    const data = req.body.data;
    const insertedRow = await query("INSERT INTO hospitals SET ?", data);
    res.send(insertedRow);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.post("/update", requireRole("admin"), async (req, res) => {
  console.log("//// UPDATE hospitals ////");
  try {
    let data = req.body.data;
    let whereId = data.id;
    delete data.id;

    const columns = Object.keys(data);
    const values = Object.values(data);

    const updatedRow = await query(
      "UPDATE hospitals SET " +
        columns.join(" = ?, ") +
        " = ? WHERE id = " +
        whereId,
      values
    );

    res.send(updatedRow);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.post("/delete", requireRole("admin"), async (req, res) => {
  console.log("//// DELETE hospitals ////");
  try {
    const hospitalId = req.body.data.id;

    const [[{ submissionsCount }], [{ loginsCount }], [{ templatesCount }]] =
      await Promise.all([
        query("SELECT COUNT(*) AS submissionsCount FROM submissions WHERE hospital_id = ?", [hospitalId]),
        query("SELECT COUNT(*) AS loginsCount FROM login WHERE hospital_id = ?", [hospitalId]),
        query("SELECT COUNT(*) AS templatesCount FROM hospital_technical WHERE hospital_id = ?", [hospitalId]),
      ]);

    if (submissionsCount || loginsCount || templatesCount) {
      return res.status(400).send({
        message:
          "Esta instituição tem representantes, submissões ou templates associados e não pode ser eliminada.",
      });
    }

    const deletedRow = await query("DELETE from hospitals WHERE id = ?", [
      hospitalId,
    ]);
    res.send(deletedRow);
  } catch (e) {
    console.log(e);
    res.status(500).send({ message: "Some error on server.", error: e });
  }
});

router.post(
  "/technical/save",
  requireOwnHospital((req) => req.body.data.hospital_id),
  async (req, res) => {
    try {
      const { data, technical_id } = req.body;

      // Uma plataforma/anticorpo pendente ou rejeitada pode ficar associada
      // ao template — fica sinalizado como "não validado" na listagem/form,
      // e só a criação de submissões (submissionHer /create) exige "approved".
      let existing = [];

      if (technical_id) {
        existing = await query(
          `
          SELECT id
          FROM hospital_technical
          WHERE id = ?
          LIMIT 1
        `,
          [technical_id]
        );
      }

      const payload = {
        hospital_id: data.hospital_id,

        biomarcador: data.biomarcador || null,
        topografia: data.topografia || null,
        plataforma: data.plataforma || null,
        anticorpo: data.anticorpo || null,
        plataforma_id: data.plataforma_id || null,
        anticorpo_id: data.anticorpo_id || null,

        technical_data: JSON.stringify({
          ...data,
        }),
      };

      delete JSON.parse(payload.technical_data).hospital_id;

      // biomarcador + topografia + anticorpo é a chave de duplicidade de um
      // template — enforced aqui (não só no form) para cobrir chamadas
      // diretas à API e updates concorrentes que o check do cliente não vê.
      const duplicates = await query(
        `
        SELECT id
        FROM hospital_technical
        WHERE hospital_id = ?
          AND biomarcador <=> ?
          AND topografia <=> ?
          AND anticorpo <=> ?
          AND id != ?
        LIMIT 1
      `,
        [
          payload.hospital_id,
          payload.biomarcador,
          payload.topografia,
          payload.anticorpo,
          technical_id || 0,
        ]
      );

      if (duplicates.length) {
        return res.status(409).send({
          message: `Já existe um template para ${payload.biomarcador} / ${payload.topografia} / ${payload.anticorpo}.`,
        });
      }

      let result;

      if (existing.length) {
        const id = existing[0].id;

        result = await query(
          `
          UPDATE hospital_technical
          SET ?
          WHERE id = ?
        `,
          [payload, id]
        );
      } else {
        result = await query(
          `
          INSERT INTO hospital_technical
          SET ?
        `,
          [payload]
        );
      }

      res.send(result);
    } catch (e) {
      console.log(e);

      res.status(500).send({
        message: "Some error on server.",
        error: e,
      });
    }
  }
);

router.get(
  "/technical/read",
  requireOwnHospital((req) => hospitalIdOfTechnical(req.query.id)),
  async (req, res) => {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).send({
          message: "id is required.",
        });
      }

      const result = await query(
        `
        SELECT
          ht.*,
          p.status AS plataforma_status,
          a.status AS anticorpo_status
        FROM hospital_technical ht
        LEFT JOIN platforms p ON p.id = ht.plataforma_id
        LEFT JOIN antibodies a ON a.id = ht.anticorpo_id
        WHERE ht.id = ?
        LIMIT 1
      `,
        [id]
      );

      if (!result.length) {
        return res.status(404).send({
          message: "Technical data not found.",
        });
      }

      const technical = result[0];

      let technicalData = {};

      try {
        technicalData = technical.technical_data
          ? JSON.parse(technical.technical_data)
          : {};
      } catch (e) {
        console.log(e);
      }

      res.send({
        id: technical.id,
        hospital_id: technical.hospital_id,

        biomarcador: technical.biomarcador,
        topografia: technical.topografia,
        plataforma: technical.plataforma,
        anticorpo: technical.anticorpo,

        created_at: technical.created_at,

        ...technicalData,

        plataforma_id: technical.plataforma_id,
        anticorpo_id: technical.anticorpo_id,
        // NULL quando não há id associado (registo antigo/texto livre) - só
        // sinalizamos "não validado" quando há mesmo uma sugestão a aguardar
        // aprovação ou rejeitada por trás do plataforma_id/anticorpo_id.
        plataforma_status: technical.plataforma_status || null,
        anticorpo_status: technical.anticorpo_status || null,
        technical_data: technical.technical_data,
      });
    } catch (e) {
      console.log(e);

      res.status(500).send({
        message: "Some error on server.",
        error: e,
      });
    }
  }
);

router.get(
  "/technical/readByHospital",
  requireOwnHospital((req) => req.query.id),
  async (req, res) => {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).send({
          message: "hospital_id is required.",
        });
      }

      const result = await query(
        `
        SELECT
          ht.*,
          p.status AS plataforma_status,
          a.status AS anticorpo_status
        FROM hospital_technical ht
        LEFT JOIN platforms p ON p.id = ht.plataforma_id
        LEFT JOIN antibodies a ON a.id = ht.anticorpo_id
        WHERE ht.hospital_id = ?
        ORDER BY ht.id DESC
        `,
        [id]
      );

      const data = result.map((technical) => {
        let technicalData = {};

        try {
          technicalData = technical.technical_data
            ? JSON.parse(technical.technical_data)
            : {};
        } catch (err) {
          console.log(err);
        }

        return {
          id: technical.id,
          hospital_id: technical.hospital_id,

          biomarcador: technical.biomarcador,
          topografia: technical.topografia,
          plataforma: technical.plataforma,
          anticorpo: technical.anticorpo,

          created_at: technical.created_at,

          ...technicalData,

          plataforma_id: technical.plataforma_id,
          anticorpo_id: technical.anticorpo_id,
          plataforma_status: technical.plataforma_status || null,
          anticorpo_status: technical.anticorpo_status || null,
          technical_data: technical.technical_data,
        };
      });

      res.send(data);
    } catch (e) {
      console.log(e);

      res.status(500).send({
        message: "Some error on server.",
        error: e,
      });
    }
  }
);

router.delete(
  "/technical/delete",
  requireOwnHospital((req) => hospitalIdOfTechnical(req.query.id)),
  async (req, res) => {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).send({
          message: "id is required",
        });
      }

      await query(
        `
        DELETE FROM hospital_technical
        WHERE id = ?
        `,
        [id]
      );

      res.send({
        success: true,
        message: "Template deleted successfully",
      });
    } catch (e) {
      console.log(e);

      res.status(500).send({
        message: "Some error on server.",
        error: e,
      });
    }
  }
);

module.exports = router;
