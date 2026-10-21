const { ZodError } = require("zod");

// Este middleware recibe un esquema y valida de forma segura req.body, req.params o req.query
const validar = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.query) req.query = schemas.query.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: "Aserción de datos fallida",
        detalles: error.errors.map(err => ({
          campo: err.path.join('.'),
          mensaje: err.message
        }))
      });
    }
    next(error);
  }
};

module.exports = validar;
