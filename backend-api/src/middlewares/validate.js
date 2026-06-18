const { ZodError } = require("zod");

const VALID_TARGETS = ["body", "query", "params"];

/**
 * validate(schema, target?, options?)
 * - schema: Zod schema
 * - target: "body" | "query" | "params" (default: body)
 * - options:
 *    - fieldLabels: map field -> label
 *    - allowUnknown: future extension (placeholder)
 */
module.exports = (schema, target = "body", options = {}) => {
  // normalize target (phòng trường hợp dev truyền sai kiểu)
  if (typeof target === "object") {
    options = target;
    target = "body";
  }

  // validate target sớm (fail fast)
  if (!VALID_TARGETS.includes(target)) {
    throw new Error(
      `[validate middleware] Invalid target "${target}". Must be one of: ${VALID_TARGETS.join(
        ", ",
      )}`,
    );
  }

  return (req, res, next) => {
    try {
      const source = req[target] ?? {};

      // parse + validate
      const result = schema.parse(source);

      // gán lại dữ liệu đã clean
      req[target] = result;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const firstError = err.errors[0];

        const fieldPath = firstError.path?.join(".") || "unknown";
        const label = options.fieldLabels?.[fieldPath] || fieldPath;

        return res.status(400).json({
          success: false,
          message: "Validation error",
          error: `${label}: ${firstError.message}`,
          details: err.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      next(err);
    }
  };
};
