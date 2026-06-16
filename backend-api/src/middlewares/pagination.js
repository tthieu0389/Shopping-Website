module.exports = (defaultLimit = 10, maxLimit = 100) => {
  return (req, res, next) => {
    let { page = 1, limit = defaultLimit } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > maxLimit) limit = defaultLimit;

    const offset = (page - 1) * limit;

    req.pagination = { page, limit, offset };
    next();
  };
};
