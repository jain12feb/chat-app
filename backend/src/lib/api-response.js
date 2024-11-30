// Utility function for sending error responses
export const sendErrorResponse = (res, error, statusCode = 500) => {
  console.error(error);
  res
    .status(statusCode)
    .json({ message: error.message || "Internal Server Error" });
};

// Utility function for sending success responses
export const sendSuccessResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json(data);
};
