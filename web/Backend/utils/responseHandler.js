// Success response helper
const sendSuccessResponse = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };

  return res.status(statusCode).json(response);
};

// Error response helper
const sendErrorResponse = (res, statusCode, message, error = null) => {
  const response = {
    success: false,
    message,
    ...(error && { error })
  };

  return res.status(statusCode).json(response);
};

// Pagination helper
const getPaginationOptions = (page = 1, limit = 10) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip
  };
};

// Paginated response helper
const sendPaginatedResponse = (res, statusCode, message, data, pagination) => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      totalItems: pagination.total,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrevPage: pagination.page > 1
    }
  };

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccessResponse,
  sendErrorResponse,
  getPaginationOptions,
  sendPaginatedResponse
};
