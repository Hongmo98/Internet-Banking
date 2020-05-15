var express = require('express');
var router = express.Router();

const bankController= require('../controller/bankController') 

router.get('/accountNumber',bankController.queryAccountInformation);


module.exports = router;
