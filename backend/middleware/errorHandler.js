const errorHandler = (err, req, res, next) => {
  console.error(`[Error Handler]`, err);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    res.status(400);
    message = 'Validation Failed';
    errors = Object.values(err.errors).map(val => val.message);
  }

  // Handle Mongoose Duplicate Key (Unique Index) Error
  if (err.code === 11000) {
    res.status(400);
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate field value entered: ${field}. Value must be unique.`;
  }

  // Handle Mongoose Cast Error (Invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400);
    message = `Resource not found with id of ${err.value}`;
  }

  // Send JSON response
  res.status(res.statusCode || statusCode).json({
    message,
    errors,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { errorHandler };
