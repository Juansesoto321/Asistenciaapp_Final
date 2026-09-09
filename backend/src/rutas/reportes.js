/**
 * CU-17 Busqueda avanzada · CU-18 Exportar · CU-19 Historial del aprendiz
 * + estadisticas del dashboard
 */
const express = require("express");
const controlador = require("../controladores/reportes");
const { autenticar, autorizar } = require("../middleware/autenticar");

const router = express.Router();
router.use(autenticar);

router.get("/busqueda", autorizar("administrador", "instructor"), controlador.buscar);
router.get("/exportar", autorizar("administrador", "instructor"), controlador.exportar);
router.get("/busquedas-guardadas", controlador.listarBusquedasGuardadas);
router.post("/busquedas-guardadas", controlador.guardarBusqueda);
router.get("/mi-historial", autorizar("aprendiz"), controlador.miHistorial);
router.get("/estadisticas", autorizar("administrador", "instructor"), controlador.estadisticas);

module.exports = router;
