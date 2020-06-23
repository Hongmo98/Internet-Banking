var express = require('express');
var router = express.Router();
const controllerEmployee = require('../controller/employeeController');
const verify = require('../middlewares/authMiddlewares');

const controllerHistory = require('../controller/historyController');


router.get('/history', verify('EMPLOYEE'), controllerEmployee.historyTransactionSender)
router.post('/register', verify('EMPLOYEE'), controllerEmployee.registerAccount);
router.get('/customer', verify('EMPLOYEE'), controllerEmployee.getCustomer)
router.post('/applyMoney', verify('EMPLOYEE'), controllerEmployee.ApplyMoney);
module.exports = router;
