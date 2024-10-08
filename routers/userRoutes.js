const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/check-login', authController.checkLogin);

router.post('/forgotPassword', authController.forgotPassword);
router.patch(
  '/change-password',
  authController.protectRoute,
  authController.updatePassword
);
router.patch(
  '/update-avatar',
  authController.protectRoute,
  authController.updateAvatar
);
router.patch(
  '/update-user',
  authController.protectRoute,
  authController.updateUserInfo
);

router.patch('/resetPassword/:token', authController.resetPassword);

module.exports = router;
