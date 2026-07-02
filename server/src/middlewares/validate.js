const { AppError } = require('./errorHandler');

const validate = (schema) => (req, res, next) => {
  const data = req.method === 'GET' ? req.query : req.body;
  const { error, value } = schema.validate(data, { abortEarly: false });

  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return next(new AppError(message, 400));
  }

  if (req.method === 'GET') req.query = value;
  else req.body = value;
  next();
};

module.exports = validate;
