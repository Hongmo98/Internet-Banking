var express = require('express');
var router = express.Router();
const controllerHistory = require('../controller/historyController');
const verify = require('../middlewares/authMiddlewares');

router.get('/historyTransaction', verify('CUSTOMER'), controllerHistory.historyTransactionSender)
module.exports = router;
