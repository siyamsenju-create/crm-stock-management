/**
 * Pagination middleware.
 * Parses page / limit / sort / search from query params,
 * attaches a `paginate()` helper to req, and sets up the
 * response envelope after the controller is done.
 *
 * Usage in controller:
 *   const { data, pagination } = await req.paginate(Model, filter);
 */
const paginate = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  /**
   * Execute a paginated Mongoose query.
   *
   * @param {import('mongoose').Model} Model - Mongoose model
   * @param {object} [filter={}]            - Query filter
   * @param {object} [projection]           - Optional field projection
   * @param {object} [populateOptions]      - Optional populate config
   * @returns {{ data: any[], pagination: object, total: number }}
   */
  req.paginate = async (Model, filter = {}, projection = null, populateOptions = null) => {
    const sortBy = req.query.sort
      ? req.query.sort.split(',').join(' ')
      : '-createdAt';

    const total = await Model.countDocuments(filter);

    let query = Model.find(filter, projection).sort(sortBy).skip(skip).limit(limit);

    if (populateOptions) {
      query = query.populate(populateOptions);
    }

    const data = await query;

    const pagination = {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };

    if ((page - 1) * limit + data.length < total) {
      pagination.next = { page: page + 1, limit };
    }

    if (page > 1) {
      pagination.prev = { page: page - 1, limit };
    }

    return { data, pagination };
  };

  next();
};

module.exports = paginate;
