
var express = require('express');
var router = express.Router();
const controllerUser = require('../controller/userController');
const verify = require('../middlewares/authMiddlewares');


router.post('/login', controllerUser.login);


router.post('/refresh', controllerUser.refreshToken);
router.post('/requestForgotPassword', controllerUser.requestForgotPassword);
router.post('/forgotPassword', controllerUser.forgotPassword);
router.get('/logout', verify, controllerUser.logout);


// auth
router.get('/user', verify('CUSTOMER'), controllerUser.getUserCurrent);
router.get('/information', verify('CUSTOMER'), controllerUser.getInfo);
router.get('/accountNumber', verify('CUSTOMER'), controllerUser.getAccountNumber)
router.post('/updatePassword', verify('CUSTOMER'), controllerUser.updatePassword);

module.exports = router;
