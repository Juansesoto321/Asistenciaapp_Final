-- Estructura curricular del SENA (recomendacion del instructor):
--   Competencia  ->  Resultados de Aprendizaje (RAP)  ->  Tematicas
-- Un mismo RAP se dicta en varios trimestres con tematicas distintas, por eso
-- la tematica cuelga del RAP y no de la competencia.
-- Idempotente: puede ejecutarse sobre una instalacion existente.

CREATE TABLE IF NOT EXISTS competencia (
  id_competencia SERIAL PRIMARY KEY,
  codigo         VARCHAR(30),
  nombre         VARCHAR(300) NOT NULL UNIQUE,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resultado_aprendizaje (
  id_rap         SERIAL PRIMARY KEY,
  id_competencia INTEGER NOT NULL REFERENCES competencia(id_competencia) ON DELETE CASCADE,
  codigo         VARCHAR(30) NOT NULL UNIQUE,
  nombre         TEXT NOT NULL,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tematica (
  id_tematica SERIAL PRIMARY KEY,
  id_rap      INTEGER NOT NULL REFERENCES resultado_aprendizaje(id_rap) ON DELETE CASCADE,
  nombre      VARCHAR(200) NOT NULL,
  UNIQUE (id_rap, nombre)
);

-- Que se dicta en cada bloque del horario (lo que el calendario muestra)
ALTER TABLE horario ADD COLUMN IF NOT EXISTS id_rap      INTEGER REFERENCES resultado_aprendizaje(id_rap);
ALTER TABLE horario ADD COLUMN IF NOT EXISTS id_tematica INTEGER REFERENCES tematica(id_tematica);

CREATE INDEX IF NOT EXISTS idx_rap_competencia ON resultado_aprendizaje(id_competencia);
CREATE INDEX IF NOT EXISTS idx_tematica_rap    ON tematica(id_rap);
