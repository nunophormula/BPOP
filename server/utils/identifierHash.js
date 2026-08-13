const crypto = require("crypto");

// Chave secreta usada só para pseudonimizar patient/diagnostic das
// submissões (mesmo espírito das passwords: nunca gravar o valor original).
// Ao contrário do bcrypt, tem de ser determinística (HMAC, não salgada) para
// permitir detetar duplicados sem guardar o valor em claro.
const HASH_SECRET =
  "6caf312ba7957e08f0a154472d17fa9ab7cad4eadff6bfb18afb99651940909d468c47405b27f12a0d1be37d6ed1c37c";

// Truncado a 10 carateres (40 bits) só por legibilidade, tal como o esquema
// antigo — continua a ser impossível de inverter sem a chave secreta, que é
// isso que impede reconstruir o valor original a partir do hash.
function hashIdentifier(value) {
  return crypto
    .createHmac("sha256", HASH_SECRET)
    .update(String(value ?? "").trim().toUpperCase())
    .digest("hex")
    .substring(0, 10)
    .toUpperCase();
}

module.exports = { hashIdentifier };
