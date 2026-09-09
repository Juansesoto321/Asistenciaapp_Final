/**
 * Estructura curricular: competencias, resultados de aprendizaje y tematicas.
 * Consultarlas puede cualquier usuario autenticado (el calendario las muestra);
 * crearlas y modificarlas es tarea del coordinador y del programador.
 */
const express = require("express");
const { autenticar, autorizar } = require("../middleware/autenticar");
const controlador = require("../controladores/competencias");

const router = express.Router();
router.use(autenticar);

const PLANEACION = ["coordinador", "programador"];

// Rutas especificas primero, para que no las capture "/:id"
router.post("/carga-masiva", autorizar(...PLANEACION), controlador.cargaMasiva);

// Resultados de aprendizaje
router.get("/raps", controlador.listarRaps);
router.post("/raps", autorizar(...PLANEACION), controlador.crearRap);
router.put("/raps/:id", autorizar(...PLANEACION), controlador.editarRap);
router.delete("/raps/:id", autorizar(...PLANEACION), controlador.eliminarRap);

// Temáticas
router.post("/tematicas", autorizar(...PLANEACION), controlador.crearTematica);
router.delete("/tematicas/:id", autorizar(...PLANEACION), controlador.eliminarTematica);

// Competencias
router.get("/", controlador.listarCompetencias);
router.post("/", autorizar(...PLANEACION), controlador.crearCompetencia);
router.put("/:id", autorizar(...PLANEACION), controlador.editarCompetencia);
router.delete("/:id", autorizar(...PLANEACION), controlador.eliminarCompetencia);

module.exports = router;
