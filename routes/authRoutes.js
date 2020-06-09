
var express = require('express');
var router = express.Router();
const controllerUser = require('../controller/userController');
const verify = require('../middlewares/authMiddlewares');
// const Unauthorized = require('../middlewares/loginAuth');

router.post('/login', controllerUser.login);
router.post('/captcha', controllerUser.recaptchaGoogle)

router.post('/refresh', controllerUser.refreshToken);
router.post('/requestForgotPassword', controllerUser.requestForgotPassword);
router.post('/forgotPassword', controllerUser.forgotPassword);
// router.get('/logout', Unauthorized, controllerUser.logout);


// auth
router.get('/user', verify, controllerUser.getUserCurrent);
router.get('/information', verify, controllerUser.getInfo);
router.get('/accountNumber', verify, controllerUser.getAccountNumber)
router.post('/updatePassword', verify, controllerUser.updatePassword);
module.exports = router;
