const jwt = require('jsonwebtoken');
const UnauthorizedError = require('../errors/UnauthorizedError');
const { devSecret } = require('../utils/config');
const { unauthorizedError } = require('../constants/messages');

const { JWT_SECRET = devSecret } = process.env;

module.exports = (req, res, next) => {
  const token = req.cookies.jwt;
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    next(new UnauthorizedError(unauthorizedError));
  }
  req.user = payload;
  next();
};
