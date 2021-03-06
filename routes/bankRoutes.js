var express = require('express');
var router = express.Router();

const bankController = require('../controller/bankController')

router.get('/accountNumber', bankController.queryAccountInformation);
router.post('/transfer', bankController.transactionAccount);
router.post('/link', bankController.linkBankPartnerPGP);
router.post('/transferPgp', bankController.linkBankPartnerTransferPgp)

router.get('/accountRsa', bankController.linkBankPartnerRsa);
router.post('/transferRsa', bankController.transferRsa);

module.exports = router;
