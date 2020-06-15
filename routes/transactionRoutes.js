var express = require('express');
var router = express.Router();
const verify = require('../middlewares/authMiddlewares');

const transferController = require('../controller/transactionController');
//transfer
router.post('/transferInternal', verify, transferController.transferInternal);
router.post('/requestReceiver', verify, transferController.requestReceiver);
router.post('/verifyOTP', verify, transferController.verifyOTP);

// router.get('/requestAccountNumber', verify, transferController.requestAccountNumber);




// list Receiver
router.post('/receivers', verify, transferController.saveReceive);
router.get('/receiver', verify, transferController.receiverTransfer);
router.post('/receiver', verify, transferController.deleteReceiver);
router.get('/receiverInformation', verify, transferController.receiverInformation)
router.post('/updateReceiver', verify, transferController.updateReceiver);
// remind dept

router.post('/requestDept', verify, transferController.requestDept);
router.get('/showDeptRemindUnPay', verify, transferController.showDeptRemindUnPay);
router.get('/showDeptRemind', verify, transferController.showDeptRemind);
router.get('/notificationDept', verify, transferController.notificationDept)
// router.get('/getListNotification',verify,transferController.getListNotification)
router.post('/deleteReminder', verify, transferController.deleteReminder);
router.post('/transferReminder', verify, transferController.transferReminder);


router.get('/test', transferController.test);
router.get('/test1', transferController.test1);



module.exports = router;
