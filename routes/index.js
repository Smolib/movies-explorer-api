const router = require('express').Router();
const userRouter = require('./users');
const movieRouter = require('./movies');
const NotFoundError = require('../errors/NotFoundError');
const auth = require('../middlewares/auth');
const {
  createUser, login, signOut,
} = require('../controllers/users');
const { signupValidator, signinValidator } = require('../middlewares/validation');

router.post('/signup', signupValidator, createUser);
router.post('/signin', signinValidator, login);
router.use(auth);
router.post('/signout', signOut);
router.use(userRouter);
router.use(movieRouter);
router.use('*', (req, res, next) => {
  next(new NotFoundError('Страница не найдена'));
});

module.exports = router;
