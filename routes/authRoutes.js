
var express = require('express');
var router = express.Router();
const controllerUser = require('../controller/userController');


router.post('/login', controllerUser.login);
router.post('/register', controllerUser.registerAccount);
router.post('/refresh', controllerUser.refreshToken);
module.exports = router;
