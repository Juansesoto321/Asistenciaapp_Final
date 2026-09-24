-- Ejecutar una vez en instalaciones existentes creadas antes del registro de errores.
CREATE TABLE IF NOT EXISTS log_error (
  id_log     SERIAL PRIMARY KEY,
  nivel      VARCHAR(10)  NOT NULL DEFAULT 'error'
             CHECK (nivel IN ('error','advertencia')),
  mensaje    TEXT         NOT NULL,
  metodo     VARCHAR(10),
  ruta       VARCHAR(255),
  id_usuario INTEGER      REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  traza      TEXT,
  creado_en  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_log_error_fecha ON log_error(creado_en DESC);
