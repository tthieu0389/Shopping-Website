module.exports = (defaultLimit = 10, maxLimit = 100) => {
  return (req, res, next) => {
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    if (isNaN(page) || page < 1) page = 1;

    if (isNaN(limit) || limit < 1) {
      limit = defaultLimit;
    } else {
      limit = Math.min(limit, maxLimit);
    }

    req.pagination = {
      page,
      limit,
      offset: (page - 1) * limit,
    };

    next();
  };
};
