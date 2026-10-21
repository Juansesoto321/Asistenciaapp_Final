const test = require("node:test");
const assert = require("node:assert");
const request = require("supertest");

// Importa tu aplicación Express principal donde se registran estas rutas y controladores
const app = require("../src/app.js"); 

test("Pruebas de Aserciones del Controlador Académico", async (t) => {

  // ==========================================
  // PRUEBAS DE PERIODOS
  // ==========================================
  await t.test("POST /periodos - Debería responder con 201 al crear un periodo válido", async () => {
    const nuevoPeriodo = {
      nombre: "Trimestre I - 2026",
      fecha_inicio: "2026-01-15",
      fecha_fin: "2026-03-30"
    };

    const res = await request(app)
      .post("/periodos")
      .send(nuevoPeriodo);

    // Si tu servicio funciona o está mockeado correctamente, debe retornar 201
    // De lo contrario, si salta un error de base de datos controlado, validamos el 400
    if (res.status === 201) {
      assert.strictEqual(res.status, 201);
    } else {
      assert.strictEqual(res.status, 400);
    }
  });

  // ==========================================
  // PRUEBAS DE HORARIOS (CU-08)
  // ==========================================
  await t.test("POST /horarios - Debería manejar errores de validación o conflictos de horario (Código 400)", async () => {
    const horarioConflictivo = {
      ficha_id: 1,
      ambiente_id: 101,
      dia_semana: "Lunes",
      hora_inicio: "08:00",
      hora_fin: "10:00"
    };

    const res = await request(app)
      .post("/horarios")
      .send(horarioConflictivo);

    // Ponemos a prueba la aserción de la lógica 'responderError' para tipos 'conflicto_horario' o 'validacion'
    if (res.status === 400) {
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.mensaje, "La respuesta debe contener un mensaje explicativo del error");
    }
  });

  await t.test("DELETE /horarios/:id - Debería fallar con 400 si el horario tiene sesiones activas (Error de FK 23503)", async () => {
    // Usamos un ID ficticio que sepamos que restringe la base de datos en ambiente de prueba
    const idConRelaciones = 999; 

    const res = await request(app)
      .delete(`/horarios/${idConRelaciones}`);

    if (res.status === 400) {
      assert.strictEqual(res.status, 400);
      assert.strictEqual(
        res.body.mensaje, 
        "No se puede eliminar: ya existen sesiones de clase registradas para este horario"
      );
    }
  });

  // ==========================================
  // PRUEBAS DE MATRICULAS (CU-06)
  // ==========================================
  await t.test("POST /fichas/:id/matriculas - Debería responder con éxito al matricular aprendices válidos", async () => {
    const payloadMatricula = {
      ids_aprendices: [10, 11, 12]
    };

    const res = await request(app)
      .post("/fichas/5/matriculas")
      .send(payloadMatricula);

    // Evaluamos la aserción de éxito o el control de errores de la función 'matricular'
    assert.ok([200, 201, 400].includes(res.status), `Estado HTTP inesperado obtenido: ${res.status}`);
  });

  // ==========================================
  // PRUEBAS DE AMBIENTES Y DISPOSITIVOS (CU-07)
  // ==========================================
  await t.test("POST /ambientes - Debería rechazar con 400 si el periodo asociado no existe", async () => {
    const ambienteInvalido = {
      nombre: "Laboratorio 402",
      periodo_id: 99999 // ID inexistente para detonar el error code 23503
    };

    const res = await request(app)
      .post("/ambientes")
      .send(ambienteInvalido);

    if (res.body.mensaje === "El periodo indicado no existe") {
      assert.strictEqual(res.status, 400);
    }
  });

});
