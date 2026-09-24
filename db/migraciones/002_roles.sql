-- Estado actual de los roles del sistema. Es idempotente: puede ejecutarse
-- las veces que haga falta sobre una instalacion existente.
--
-- Historia de cambios:
--   1. Se agrego el rol "programador" (apoyo del coordinador en la planeacion).
--   2. "administrador" paso a llamarse "coordinador", que es el cargo real en
--      el SENA. El programador puede hacer lo mismo que el coordinador salvo
--      crear usuarios.
ALTER TABLE usuario DROP CONSTRAINT IF EXISTS usuario_rol_check;

UPDATE usuario SET rol = 'coordinador' WHERE rol = 'administrador';
UPDATE usuario SET nombres = 'Coordinador'
 WHERE nombres = 'Administrador' AND rol = 'coordinador';

ALTER TABLE usuario
  ADD CONSTRAINT usuario_rol_check
  CHECK (rol IN ('coordinador', 'programador', 'instructor', 'aprendiz'));
