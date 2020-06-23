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
router.post('/receivers', verify('CUSTOMER'), transferController.saveReceive);
router.get('/receiver', verify('CUSTOMER'), transferController.receiverTransfer);
router.post('/receiver', verify('CUSTOMER'), transferController.deleteReceiver);
router.get('/receiverInformation', verify('CUSTOMER'), transferController.receiverInformation)
router.post('/updateReceiver', verify('CUSTOMER'), transferController.updateReceiver);
// remind dept
//nhac nho
router.post('/requestDept', verify('CUSTOMER'), transferController.requestDept);
router.get('/showDeptRemindUnPay', verify('CUSTOMER'), transferController.showDeptRemindUnPay);
router.get('/showDeptRemind', verify('CUSTOMER'), transferController.showDeptRemind);
router.get('/getBadgeNumber', verify('CUSTOMER'), transferController.getBadgeNumber)
router.get('/getListNotification', verify('CUSTOMER'), transferController.getListNotification)
router.post('/deleteReminder', verify('CUSTOMER'), transferController.deleteReminder);
router.post('/transferReminder', verify('CUSTOMER'), transferController.transferReminder);
router.post('/updateReminder', verify('CUSTOMER'), transferController.updateReminder);

router.get('/test', transferController.test);
router.get('/test1', transferController.test1);



module.exports = router;
