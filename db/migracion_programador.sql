-- Ejecutar una vez en instalaciones existentes creadas antes del rol programador.
ALTER TABLE usuario DROP CONSTRAINT IF EXISTS usuario_rol_check;
ALTER TABLE usuario
  ADD CONSTRAINT usuario_rol_check
  CHECK (rol IN ('administrador', 'programador', 'instructor', 'aprendiz'));
