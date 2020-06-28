var express = require('express');
var router = express.Router();
const controllerAdmin = require('../controller/adminController');
const verify = require('../middlewares/authMiddlewares');

router.post('/create/employee', controllerAdmin.createEmployee);
router.get('/employee', verify('ADMIN'), controllerAdmin.getAllEmployee);
router.get('/getEmployee', verify('ADMIN'), controllerAdmin.getEmployee);
router.post('/updateEmployee', verify('ADMIN'), controllerAdmin.updateEmployee);
router.post('/deleteEmployee', verify('ADMIN'), controllerAdmin.deleteEmployee);
router.get('/showhistoryLinkBank', verify('ADMIN'), controllerAdmin.showhistoryLinkBank)



module.exports = router;