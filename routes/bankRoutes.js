var express = require('express');
var router = express.Router();

const bankController = require('../controller/bankController')

router.get('/accountNumber', bankController.queryAccountInformation);
router.post('/transfer', bankController.transactionAccount);
router.post('/transaction', bankController.testPgp);

module.exports = router;
