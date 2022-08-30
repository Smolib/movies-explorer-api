const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const UnauthorizedError = require('../errors/UnauthorizedError');
const ConflictError = require('../errors/ConflictError');
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
        next(new ConflictError('Этот email уже занят'));
      }
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Некорректные данные для создания пользователя'));
      } else next(err);
    });
};

const updateUser = (req, res, next) => {
  const { name, email } = req.body;
  User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true })
    .orFail(new NotFoundError('Пользователь не найден'))
    .then((user) => {
      res.status(ok).send(user);
    })
    .catch((err) => {
      if (err.code === 11000) {
        next(new ConflictError('Нельзя обновлять данные других пользователей'));
      }
      if (err.name === 'ValidationError') {
        next(new BadRequestError('Некорректные данные для обновления данных пользователя'));
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
        sameSite: true,
        // secure: true,
      })
        .send({
          message: 'Вход в систему завершен успешно',
        });
    })
    .catch((err) => {
      next(new UnauthorizedError(err.message));
    });
};

const signOut = (req, res) => {
  res.clearCookie('jwt').send({ message: 'Успешный выход из системы' });
};

module.exports = {
  getUserMe,
  createUser,
  updateUser,
  login,
  signOut,
};
