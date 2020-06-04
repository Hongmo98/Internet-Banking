var express = require('express');
var router = express.Router();
const verify = require('../middlewares/authMiddlewares');

const transferController = require('../controller/transactionController');
//transfer
router.post('/transferInternal', verify, transferController.transferInternal);
router.get('/requestReceiver', verify, transferController.requestReceiver);
router.post('/verifyOTP', verify, transferController.verifyOTP);

// list Receiver
router.post('/receivers', verify, transferController.saveReceive);
router.get('/receiver', verify, transferController.receiverTransfer);
module.exports = router;
