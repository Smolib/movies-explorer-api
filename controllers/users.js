const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const UnauthorizedError = require('../errors/UnauthorizedError');
const ConflictError = require('../errors/ConflictError');
const {
  emailIsAlreadyBusy,
  incorrectDataToCreateUser,
  userNotFound,
  cannotChangeOtherUsers,
  incorrectDataToUpdateUser,
  successSingin,
  successSingout,
} = require('../constants/messages');
const User = require('../models/user');
const {
  ok, created,
} = require('../constants/statuses');
const { devSecret } = require('../utils/config');

const { JWT_SECRET = devSecret } = process.env;
const getUserMe = (req, res, next) => {
  User.findById(req.user._id).then((user) => res.status(ok).send(user))
    .catch(next);
};

const createUser = (req, res, next) => {
  const {
    name, email, password,
  } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name, email, password: hash,
    }))
    .then((user) => res.status(created).send({
      name: user.name, email: user.email,
    }))
    .catch((err) => {
      if (err.code === 11000) {
        next(new ConflictError(emailIsAlreadyBusy));
      }
      if (err.name === 'ValidationError') {
        next(new BadRequestError(incorrectDataToCreateUser));
      } else next(err);
    });
};

const updateUser = (req, res, next) => {
  const { name, email } = req.body;
  User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true })
    .orFail(new NotFoundError(userNotFound))
    .then((user) => {
      res.status(ok).send(user);
    })
    .catch((err) => {
      if (err.code === 11000) {
        next(new ConflictError(cannotChangeOtherUsers));
      }
      if (err.name === 'ValidationError') {
        next(new BadRequestError(incorrectDataToUpdateUser));
      } else next(err);
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.cookie('jwt', token, {
        maxAge: 3600000,
        httpOnly: true,
        sameSite: 'None',
        secure: true,
      })
        .send({
          message: successSingin,
        });
    })
    .catch((err) => {
      next(new UnauthorizedError(err.message));
    });
};

const signOut = (req, res) => {
  res.clearCookie('jwt').send({ message: successSingout });
};

module.exports = {
  getUserMe,
  createUser,
  updateUser,
  login,
  signOut,
};
