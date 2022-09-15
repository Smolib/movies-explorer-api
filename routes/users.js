const router = require('express').Router();
const { getUserMe, updateUser } = require('../controllers/users');
const { userUpdateValidator } = require('../middlewares/validation');

router.get('/users/me', getUserMe);
router.patch('/users/me', userUpdateValidator, updateUser);

module.exports = router;
