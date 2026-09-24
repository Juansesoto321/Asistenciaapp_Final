const pool = require("../config/db");

async function obtenerTodo() {
  const r = await pool.query("SELECT * FROM configuracion");
  return Object.fromEntries(r.rows.map((f) => [f.clave, f.valor]));
}

async function guardar(clave, valor) {
  await pool.query(
    "INSERT INTO configuracion (clave, valor) VALUES ($1,$2) ON CONFLICT (clave) DO UPDATE SET valor = $2",
    [clave, String(valor)]
  );
}

module.exports = { obtenerTodo, guardar };
