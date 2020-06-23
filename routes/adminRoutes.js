var express = require('express');
var router = express.Router();
const controllerAdmin = require('../controller/adminController');
const verify = require('../middlewares/authMiddlewares');

router.post('/create/employee', verify('ADMIN'), controllerAdmin.createEmployee);
router.get('/employee', verify('ADMIN'), controllerAdmin.getAllEmployee);
router.get('/getEmployee', verify('ADMIN'), controllerAdmin.getEmployee);
router.post('/updateEmployee', verify('ADMIN'), controllerAdmin.updateEmployee);
router.post('/deleteEmployee', verify('ADMIN'), controllerAdmin.deleteEmployee);



module.exports = router;
