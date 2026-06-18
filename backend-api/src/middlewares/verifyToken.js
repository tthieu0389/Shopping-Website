const jwt = require("jsonwebtoken");

/**
 * verifyToken(options?)
 * options:
 *  - optional: boolean (cho phép route không cần token)
 */
module.exports = (options = {}) => {
  return (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    // nếu route optional auth
    if (!token) {
      if (options.optional) return next();

      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // chuẩn hóa user object
      req.user = {
        id: decoded.id,
        role: decoded.role,
        ...decoded,
      };

      next();
    } catch (err) {
      return res.status(403).json({
        success: false,
        error: "Invalid or expired token",
      });
    }
  };
};
