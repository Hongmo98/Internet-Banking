var express = require('express');
var router = express.Router();
const controllerEmployee = require('../controller/employeeController');
const verify = require('../middlewares/authMiddlewares');


router.post('/register', verify, controllerEmployee.registerAccount);
router.get('/customer', verify, controllerEmployee.getCustomer)
router.post('/applyMoney', verify, controllerEmployee.ApplyMoney);
module.exports = router;
