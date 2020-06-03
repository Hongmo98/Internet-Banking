
var express = require('express');
var router = express.Router();
const controllerUser = require('../controller/userController');
const verify = require('../middlewares/authMiddlewares');


router.post('/login', controllerUser.login);
router.post('/register', controllerUser.registerAccount);
router.post('/refresh', controllerUser.refreshToken);
router.post('/requestForgotPassword', controllerUser.requestForgotPassword);
router.post('/forgotPassword', controllerUser.forgotPassword);


// auth
router.get('/current', verify, controllerUser.getUserCurrent);
router.post('/updatePassword', verify, controllerUser.updatePassword);
module.exports = router;
