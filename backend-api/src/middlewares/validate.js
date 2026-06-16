const { ZodError } = require("zod");

module.exports =
  (schema, options = {}) =>
  (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const firstError = err.errors[0];
        const field = firstError.path.join(".");
        const label = options.fieldLabels?.[field] || field;

        return res.status(400).json({
          error: `${label}: ${firstError.message}`,
        });
      }

      next(err);
    }
  };
