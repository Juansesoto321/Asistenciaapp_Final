/**
 * CU-05 Gestionar fichas · CU-06 Matricular · CU-07 Ambientes y lectores
 * CU-08 Horarios · CU-09 Monitorear lectores
 */
const express = require("express");
const crypto = require("crypto");
const pool = require("../config/db");
const { auditar } = require("../servicios/auditoria");
const { autenticar, autorizar } = require("../middleware/autenticar");
const controlador = require("../controladores/academico");

const router = express.Router();
router.use(autenticar);

// ---------- PERIODOS ----------
router.get("/periodos", controlador.listarPeriodos);
router.get("/instructores", autorizar("administrador", "programador"), controlador.listarInstructores);
router.post("/periodos", autorizar("administrador", "programador"), controlador.crearPeriodo);

// ---------- FICHAS (CU-05) ----------
router.get("/fichas", controlador.listarFichas);

router.post("/fichas", autorizar("administrador", "programador"), controlador.crearFicha);

// ---------- MATRICULAS (CU-06) ----------
router.get("/fichas/:id/matriculas", async (req, res) => {
  const r = await pool.query(
    `SELECT m.id_matricula, m.estado, m.fecha_matricula,
            u.id_usuario, u.nombres, u.apellidos, u.documento, u.correo,
            (pb.id_plantilla IS NOT NULL) AS tiene_huella
     FROM matricula m
     JOIN usuario u ON u.id_usuario = m.id_aprendiz
     LEFT JOIN plantilla_biometrica pb ON pb.id_aprendiz = u.id_usuario
     WHERE m.id_ficha = $1 ORDER BY u.apellidos`,
    [req.params.id]
  );
  res.json(r.rows);
});

router.post("/fichas/:id/matriculas", autorizar("administrador"), async (req, res) => {
  const { ids_aprendices } = req.body; // array de id_usuario
  const resultados = { matriculados: 0, errores: [] };
  for (const id of ids_aprendices || []) {
    try {
      await pool.query(
        "INSERT INTO matricula (id_aprendiz, id_ficha) VALUES ($1,$2)",
        [id, req.params.id]
      );
      resultados.matriculados++;
    } catch (e) {
      resultados.errores.push({
        id_aprendiz: id,
        error: e.constraint === "idx_matricula_activa_unica"
          ? "El aprendiz ya tiene una matrícula activa en otra ficha"
          : "Ya está matriculado en esta ficha",
      });
    }
  }
  await auditar(req.usuario.id, "matricular_aprendices", "ficha", Number(req.params.id), resultados);
  res.json(resultados);
});

router.patch("/matriculas/:id", autorizar("administrador"), async (req, res) => {
  try {
    const { estado } = req.body; // retirada | finalizada
    if (!["activa", "retirada", "finalizada"].includes(estado))
      return res.status(400).json({ mensaje: "Estado inválido" });
    await pool.query("UPDATE matricula SET estado = $1 WHERE id_matricula = $2", [estado, req.params.id]);
    await auditar(req.usuario.id, "cambiar_matricula", "matricula", Number(req.params.id), { estado });
    res.json({ mensaje: "Matrícula actualizada" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: "Error al actualizar la matrícula" });
  }
});

// ---------- AMBIENTES Y DISPOSITIVOS (CU-07) ----------
router.get("/ambientes", async (_req, res) => {
  const r = await pool.query(
    `SELECT a.*, d.id_dispositivo, d.serial, d.modelo, d.estado AS estado_dispositivo, d.ultimo_heartbeat
     FROM ambiente a LEFT JOIN dispositivo d ON d.id_ambiente = a.id_ambiente
     ORDER BY a.numero_ambiente`
  );
  res.json(r.rows);
});

router.post("/ambientes", autorizar("administrador"), async (req, res) => {
  try {
    const { numero_ambiente, sede_centro, id_periodo } = req.body;
    const r = await pool.query(
      "INSERT INTO ambiente (numero_ambiente, sede_centro, id_periodo) VALUES ($1,$2,$3) RETURNING *",
      [numero_ambiente, sede_centro, id_periodo || null]
    );
    await auditar(req.usuario.id, "crear_ambiente", "ambiente", r.rows[0].id_ambiente);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === "23503") return res.status(400).json({ mensaje: "El periodo indicado no existe" });
    console.error(e);
    res.status(500).json({ mensaje: "Error al crear el ambiente" });
  }
});

// Asociar lector al ambiente: genera la clave API que usara el dispositivo
router.post("/ambientes/:id/dispositivo", autorizar("administrador"), async (req, res) => {
  try {
    const { serial, modelo } = req.body;
    const claveApi = crypto.randomBytes(16).toString("hex");
    const r = await pool.query(
      `INSERT INTO dispositivo (serial, modelo, id_ambiente, clave_api, estado)
       VALUES ($1,$2,$3,$4,'no_verificado') RETURNING id_dispositivo, serial, modelo, estado`,
      [serial, modelo || "ZKTeco SenseFace 2A (simulado)", req.params.id, claveApi]
    );
    await auditar(req.usuario.id, "registrar_dispositivo", "dispositivo", r.rows[0].id_dispositivo);
    // La clave se muestra UNA sola vez, para configurar el lector/simulador
    res.status(201).json({ ...r.rows[0], clave_api: claveApi });
  } catch (e) {
    if (e.code === "23505") return res.status(400).json({ mensaje: "Serial duplicado o el ambiente ya tiene un lector asociado" });
    console.error(e);
    res.status(500).json({ mensaje: "Error al registrar el dispositivo" });
  }
});

// CU-09: panel de monitoreo de lectores
router.get("/dispositivos", autorizar("administrador"), async (_req, res) => {
  const r = await pool.query(
    `SELECT d.id_dispositivo, d.serial, d.modelo, d.estado, d.ultimo_heartbeat,
            a.numero_ambiente, a.sede_centro
     FROM dispositivo d LEFT JOIN ambiente a ON a.id_ambiente = d.id_ambiente
     ORDER BY d.serial`
  );
  res.json(r.rows);
});

// ---------- HORARIOS (CU-08) ----------
router.get("/horarios", controlador.listarHorarios);

router.post("/horarios", autorizar("administrador", "programador"), controlador.crearHorario);

router.delete("/horarios/:id", autorizar("administrador", "programador"), controlador.eliminarHorario);

module.exports = router;
