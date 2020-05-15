var express = require('express');
var router = express.Router();

const Bank= require('../controller/bankController') 

router.get('/',Bank.queryAccountInformation);

module.exports = router;
