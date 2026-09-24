const { Pool } = require("pg");
const { zonaHoraria } = require("./entorno");

// Postgres local (Windows) y el contenedor "basedatos" de Docker Compose no
// soportan SSL; solo las bases en la nube (Render/Railway/etc.) lo requieren.
const esLocal = /localhost|127\.0\.0\.1|@basedatos[:/]/.test(process.env.DATABASE_URL || "");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: esLocal ? false : { rejectUnauthorized: false },
  // CURRENT_DATE y NOW() deben usar la misma zona que el backend, sin importar
  // cómo esté configurado el servidor de base de datos (el de Docker viene en UTC).
  options: `-c timezone=${zonaHoraria}`,
});

module.exports = pool;
