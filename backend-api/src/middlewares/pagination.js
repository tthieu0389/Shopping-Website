module.exports = (defaultLimit = 10, maxLimit = 100) => {
  return (req, res, next) => {
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    let offset = parseInt(req.query.offset, 10);

    if (isNaN(limit) || limit < 1) {
      limit = defaultLimit;
    } else {
      limit = Math.min(limit, maxLimit);
    }

    if (!isNaN(offset) && offset >= 0) {
      // FE truyền offset thì tính ngược lại page
      page = Math.floor(offset / limit) + 1;
    } else {
      if (isNaN(page) || page < 1) page = 1;
      offset = (page - 1) * limit;
    }

    req.pagination = { page, limit, offset };
    next();
  };
};
