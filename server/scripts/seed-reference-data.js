// Seed the platforms and antibodies reference tables with realistic clinical
// names (the same ones already used across existing templates/submissions).
// Idempotent: `nome` is UNIQUE, so re-running inserts only what's missing.
//
// Run: node scripts/seed-reference-data.js

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

const PLATFORMS = [
  "Roche BenchMark",
  "Leica BOND",
  "Dako Omnis",
  "Master/iONtite",
];

const ANTIBODIES = [
  // HER2
  "VENTANA anti-HER2/neu (4B5)",
  "HercepTest™ mAb pharmDx (D4D4)",
  "Bond Oracle HER2 IHC System",
  // PD-L1
  "PD-L1 IHC 22C3 pharmDx",
  "VENTANA PD-L1 (SP263)",
  "VENTANA PD-L1 (SP142)",
  "PD-L1 IHC 28-8 pharmDx",
];

(async () => {
  try {
    // admin_id é obrigatório (FK para login) - usar um admin existente
    const [admin] = await q("SELECT id FROM login WHERE role = 'admin' ORDER BY id LIMIT 1");
    if (!admin) throw new Error("Nenhum admin encontrado para admin_id.");
    const adminId = admin.id;

    let plats = 0;
    for (const nome of PLATFORMS) {
      const r = await q("INSERT IGNORE INTO platforms (nome, admin_id) VALUES (?, ?)", [nome, adminId]);
      plats += r.affectedRows;
    }

    let antis = 0;
    for (const nome of ANTIBODIES) {
      const r = await q("INSERT IGNORE INTO antibodies (nome, admin_id) VALUES (?, ?)", [nome, adminId]);
      antis += r.affectedRows;
    }

    console.log(`Plataformas inseridas: ${plats} (existentes ignoradas).`);
    console.log(`Anticorpos inseridos: ${antis} (existentes ignorados).`);
  } catch (e) {
    console.error(e);
  } finally {
    db.end();
  }
})();
