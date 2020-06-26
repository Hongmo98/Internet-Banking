var express = require('express');
var router = express.Router();
const verify = require('../middlewares/authMiddlewares');
var router = express.Router();


const bankController = require('../controller/bankController')

router.get('/accountNumber', bankController.queryAccountInformation);
router.post('/transfer', bankController.transactionAccount);
router.post('/link', bankController.linkBankPartnerPGP);
router.post('/transferPgp', bankController.linkBankPartnerTransferPgp)

router.get('/accountRsa', bankController.linkBankPartnerRsa);
router.post('/transferRsa', bankController.transferRsa);


/// chuyen khoan 
router.post('/linkBankAccount', verify('CUSTOMER'), bankController.linkBankAccount);
router.post('/transferBankAccount', verify('CUSTOMER'), bankController.transferBankAccount);
router.post('/verifyOTP', verify('CUSTOMER'), bankController.verifyOTP);
router.post('/infomation', bankController.infomationU)


router.get('/getNameBankLink', verify('CUSTOMER'), bankController.getNameBankLink)
module.exports = router;
