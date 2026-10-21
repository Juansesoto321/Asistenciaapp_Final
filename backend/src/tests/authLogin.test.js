const express = require("express");
const request = require("supertest");

jest.mock("../servicios/auth");

const servicio = require("../servicios/auth");
const rutasAuth = require("../apis/auth");

const app = express();
app.use(express.json());
app.use("/api/auth", rutasAuth);

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("responde 200 y devuelve el token y los datos del usuario", async () => {
    const resultado = {
      token: "jwt-de-prueba",
      usuario: {
        id: 7,
        nombres: "Ana",
        apellidos: "Gómez",
        correo: "ana@sena.edu.co",
        rol: "aprendiz",
      },
    };
    servicio.login.mockResolvedValue(resultado);

    const respuesta = await request(app)
      .post("/api/auth/login")
      .send({ correo: "ana@sena.edu.co", contrasena: "Clave123" });

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers["content-type"]).toMatch(/application\/json/);
    expect(respuesta.body).toEqual(resultado);
    expect(servicio.login).toHaveBeenCalledWith("ana@sena.edu.co", "Clave123");
  });

  it("responde 401 con un mensaje cuando las credenciales son incorrectas", async () => {
    servicio.login.mockRejectedValue(
      Object.assign(new Error("Correo o contraseña incorrectos"), { tipo: "credenciales" })
    );

    const respuesta = await request(app)
      .post("/api/auth/login")
      .send({ correo: "ana@sena.edu.co", contrasena: "incorrecta" });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toEqual({ mensaje: "Correo o contraseña incorrectos" });
  });

  it("responde 403 cuando la cuenta está pendiente de aprobación", async () => {
    servicio.login.mockRejectedValue(
      Object.assign(new Error("Tu cuenta está pendiente de aprobación por el administrador"), {
        tipo: "cuenta_pendiente",
      })
    );

    const respuesta = await request(app)
      .post("/api/auth/login")
      .send({ correo: "ana@sena.edu.co", contrasena: "Clave123" });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body).toEqual({
      mensaje: "Tu cuenta está pendiente de aprobación por el administrador",
    });
  });
});
