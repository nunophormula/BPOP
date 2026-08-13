// Seed dummy submissions for the existing hospitals.
//
// Column vs technical_data:
//   - Identification (biomarcador, topografia, plataforma, anticorpo, produto,
//     resultado, diagnostic, patient) lives in the submission's own COLUMNS.
//   - technical_data holds the template's "Dados Técnicos" (critérios,
//     temperaturas, espessura, incubação, controlo de qualidade, ...) exactly
//     like a real submission copies it from the hospital_technical template.
//     It does NOT duplicate the identification fields.
//
// Each row carries technical_data._seed = "dummy" (metadata only, ignored by
// the app) so the dummies can be removed with:
//   node scripts/seed-dummy-submissions.js --clean
//
// Run (insert):  node scripts/seed-dummy-submissions.js
// Run (clean):   node scripts/seed-dummy-submissions.js --clean

const util = require("util");
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "127.0.0.1",
  database: "pdl1",
  user: "root",
  password: "",
  port: 3313,
});
const q = util.promisify(db.query).bind(db);

const SEED_TAG = "dummy";

// login_ids que pertencem a cada hospital (representantes reais)
const HOSPITAL_LOGINS = {
  1: [1, 10],
  2: [6],
  4: [16],
};

const PRODUTOS = ["Peça cirúrgica", "Biópsia"];

// Categorização do PD-L1 depende do tumor: TPS (pulmão e afins) vs CPS
// (cabeça e pescoço, esófago, estômago, etc.) — cada tumor só pode dar
// resultados do seu próprio parâmetro.
const PDL1_CPS_CATEGORIAS = [
  "Negativo (CPS <1)",
  "Negativo (CPS <5)",
  "Negativo (CPS <10)",
  "Positivo (CPS ≥1)",
  "Positivo (CPS ≥5 e <10)",
  "Positivo (CPS ≥10)",
  "Positivo (CPS ≥1 e <20)",
  "Positivo (CPS ≥20)",
];

const PDL1_TPS_CATEGORIAS_GENERICAS = [
  "Negativo (TPS <1%)",
  "Positivo (TPS ≥1%)",
  "Positivo (TPS ≥5%)",
];

const PDL1_SCORING = {
  Pulmão: {
    parametro: "TPS",
    categorias: [
      "Negativo (TPS <1%)",
      "Positivo ligeiro / intermédio (TPS 1-49%)",
      "Positivo forte (TPS ≥50%)",
    ],
  },
  Melanoma: { parametro: "TPS", categorias: PDL1_TPS_CATEGORIAS_GENERICAS },
  Bexiga: { parametro: "TPS", categorias: PDL1_TPS_CATEGORIAS_GENERICAS },
  Mesotelioma: { parametro: "TPS", categorias: PDL1_TPS_CATEGORIAS_GENERICAS },
  Indeterminado: { parametro: "TPS", categorias: PDL1_TPS_CATEGORIAS_GENERICAS },
  "Cabeça e pescoço": { parametro: "CPS", categorias: PDL1_CPS_CATEGORIAS },
  Esófago: { parametro: "CPS", categorias: PDL1_CPS_CATEGORIAS },
  Estômago: { parametro: "CPS", categorias: PDL1_CPS_CATEGORIAS },
  "Junção gastro-esofágica": { parametro: "CPS", categorias: PDL1_CPS_CATEGORIAS },
  "Colo do útero": { parametro: "CPS", categorias: PDL1_CPS_CATEGORIAS },
  Mama: { parametro: "CPS", categorias: PDL1_CPS_CATEGORIAS },
};

// ---- Identificação ----
// plataforma/anticorpo referem nomes que TÊM de existir em platforms/antibodies
// (seed-reference-data.js). São resolvidos para plataforma_id/anticorpo_id e só
// os IDs são gravados na submissão (as colunas de nome ficam a NULL).
const PROFILES = {
  HER2: {
    prefix: "H",
    topografias: ["Mama", "Estômago", "Cólon e recto", "Gânglio"],
    plataformas: ["Roche BenchMark", "Dako Omnis", "Leica BOND"],
    anticorpos: [
      "VENTANA anti-HER2/neu (4B5)",
      "Bond Oracle HER2 IHC System",
      "HercepTest™ mAb pharmDx (D4D4)",
    ],
    resultados: ["Negativo (0)", "Negativo (1+)", "Equívoco (2+)", "Positivo (3+)"],
    diagnosticos: ["C50.9 - Mama", "C16.9 - Estômago", "C18.9 - Cólon"],
    criterios: ["ASCO/CAP 2018/2023 (mama)", "CAP/ASCP/ASCO 2016 (esófago/estômago)", "HERAccles (cólon)"],
  },
  "PD-L1": {
    prefix: "P",
    topografias: Object.keys(PDL1_SCORING),
    plataformas: ["Roche BenchMark", "Dako Omnis"],
    anticorpos: [
      "PD-L1 IHC 22C3 pharmDx",
      "VENTANA PD-L1 (SP263)",
      "VENTANA PD-L1 (SP142)",
      "PD-L1 IHC 28-8 pharmDx",
    ],
    diagnosticos: ["C34.1 - Pulmão", "C53.9 - Colo do útero", "C32.9 - Laringe"],
    criterios: ["CAP/ASCP/ASCO 2016 (esófago/estômago)", "Outro"],
  },
};

// ---- Dados Técnicos (technical_data) ----
const TECIDOS = ["Amígdala", "Placenta", "Mama normal", "Tonsila"];
const RECUPERACAO = ["Calor (pH alto)", "Calor (pH baixo)", "Enzimática"];
const PROGRAMAS = ["NordiQC", "UK-NEQAS", "Outro"];

const PROCESSES_PER_HOSPITAL = 8; // processos (nº de paciente) por hospital
const MAX_SUBS_PER_PROCESS = 3; // submissões por processo (1..N)

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// data aleatória nos últimos `days` dias, formato MySQL DATETIME
function randomDateWithin(days) {
  const past = Date.now() - randInt(0, days) * 24 * 60 * 60 * 1000;
  const d = new Date(past - randInt(0, 12) * 60 * 60 * 1000);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// "Dados Técnicos" realistas de um template (o que uma submissão real copia)
function buildTechnicalData(profile) {
  return {
    _seed: SEED_TAG,
    criteriosUtilizados: pick(profile.criterios),
    temperaturaBanhos: randInt(37, 45),
    temperaturaEstufa: randInt(58, 62),
    espessuraCortes: randInt(3, 5),
    controlosInternos: pick(["Sim", "Não"]),
    tecidosUtilizados: pick(TECIDOS),
    tipoRecuperacao: pick(RECUPERACAO),
    tempoRecuperacao: randInt(20, 60),
    temperaturaRecuperacao: randInt(95, 100),
    tempoIncubacao: randInt(15, 60),
    validacoesInternas: pick(["Sim", "Não"]),
    periodicidade: pick([6, 12]),
    avaliacaoExterna: pick(["Sim", "Não", "Outro"]),
    programasQualidade: pick(PROGRAMAS),
    numeroTestesAno: randInt(100, 1500),
    taxaRepeticoes: randInt(1, 10),
    percentagemExpressao: randInt(0, 100),
  };
}

async function clean() {
  const result = await q(
    "DELETE FROM submissions WHERE JSON_EXTRACT(technical_data, '$._seed') = ?",
    [SEED_TAG]
  );
  console.log(`Removidas ${result.affectedRows} submissões dummy.`);
}

// name -> id a partir das tabelas de referência
async function loadRefMaps() {
  const platforms = {};
  (await q("SELECT id, nome FROM platforms")).forEach((r) => (platforms[r.nome] = r.id));
  const antibodies = {};
  (await q("SELECT id, nome FROM antibodies")).forEach((r) => (antibodies[r.nome] = r.id));
  return { platforms, antibodies };
}

async function seed() {
  const { platforms, antibodies } = await loadRefMaps();

  // valida que todos os nomes usados existem nas tabelas de referência
  const missing = [];
  for (const profile of Object.values(PROFILES)) {
    profile.plataformas.forEach((n) => { if (!platforms[n]) missing.push(`plataforma "${n}"`); });
    profile.anticorpos.forEach((n) => { if (!antibodies[n]) missing.push(`anticorpo "${n}"`); });
  }
  if (missing.length) {
    throw new Error(
      `Faltam registos em platforms/antibodies. Corre 'node scripts/seed-reference-data.js' primeiro. Em falta: ${missing.join(", ")}`
    );
  }

  let total = 0;

  for (const [hospitalId, loginIds] of Object.entries(HOSPITAL_LOGINS)) {
    for (let p = 0; p < PROCESSES_PER_HOSPITAL; p++) {
      const biomarcador = Math.random() < 0.5 ? "HER2" : "PD-L1";
      const profile = PROFILES[biomarcador];
      const seq = String(randInt(1, 999)).padStart(4, "0");
      const patient = `${profile.prefix}2026/${seq}`;
      const loginId = pick(loginIds);
      const subsCount = randInt(1, MAX_SUBS_PER_PROCESS);

      for (let s = 0; s < subsCount; s++) {
        // 1 submissão em cada ~6 é datada de hoje (para a estatística "hoje")
        const createdAt = Math.random() < 0.15 ? randomDateWithin(0) : randomDateWithin(90);
        const plataformaId = platforms[pick(profile.plataformas)];
        const anticorpoId = antibodies[pick(profile.anticorpos)];
        const topografia = pick(profile.topografias);

        // PD-L1: a categorização (TPS vs CPS) depende do tumor, por isso o
        // resultado tem de ser escolhido a partir do tumor sorteado, e não
        // de forma independente como no HER2 (onde a escala 0/1+/2+/3+ é a
        // mesma para todos os tecidos).
        const resultado =
          biomarcador === "PD-L1"
            ? pick(PDL1_SCORING[topografia].categorias)
            : pick(profile.resultados);

        // plataforma/anticorpo (nome) ficam a NULL - só os IDs são gravados
        await q(
          `INSERT INTO submissions
            (patient, diagnostic, biomarcador, hospital_id, login_id, type,
             topografia, plataforma, plataforma_id, anticorpo, anticorpo_id,
             produto, resultado, technical_data, created_at)
           VALUES (?, ?, ?, ?, ?, 'PDF', ?, NULL, ?, NULL, ?, ?, ?, ?, ?)`,
          [
            patient,
            pick(profile.diagnosticos),
            biomarcador,
            Number(hospitalId),
            loginId,
            topografia,
            plataformaId,
            anticorpoId,
            pick(PRODUTOS),
            resultado,
            JSON.stringify(buildTechnicalData(profile)),
            createdAt,
          ]
        );
        total++;
      }
    }
  }

  console.log(
    `Inseridas ${total} submissões dummy nos hospitais ${Object.keys(HOSPITAL_LOGINS).join(", ")}.`
  );
}

(async () => {
  try {
    if (process.argv.includes("--clean")) {
      await clean();
    } else {
      await seed();
    }
  } catch (e) {
    console.error(e);
  } finally {
    db.end();
  }
})();
