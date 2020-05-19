var bcrypt = require("bcrypt");
var openpgp = require('openpgp');
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const transaction = mongoose.model("transaction");
const partner = require('./../config/partner');
const ObjectId = mongoose.Types.ObjectId;

module.exports = {

    queryAccountInformation: async (req, res, next) => {
        //  hash= account +secret_key  + ts

        let { account } = req.query;
        let timeStamp = Date.now()
        console.log("time:", timeStamp);

        let sig = account + partner.Security_key + req.headers['headerts'];
        if (req.headers['partnercode'] === partner.Partner_Code) {

            let time = +req.headers['headerts'].toString() + 60000;
            if (+time > +timeStamp) {

                if (bcrypt.compareSync(sig, req.headers['headersig'])) {
                    try {
                        if (!account) {
                            return next({ error: { message: 'account is not exists', code: 422 } });
                        }

                        let accountNumber = await bankAccount.find({ accountNumber: account });
                        if (accountNumber == null) {
                            next({ error: { message: "Invalid data", code: 422 } });
                            return;
                        }
                        //hash khi tra ve 

                        res.status(200).json({ result: accountNumber });
                    } catch (err) {
                        next(err);
                    }
                } else {
                    next({ error: { message: 'The file has been edited', code: 402 } });
                }
            } else {
                next({ error: { message: 'time expire ', code: 402 } });
            }

        }
        else {
            next({ error: { message: ' link unsuccess ', code: 401 } });
        }


    },

    transactionAccount: async (req, res, next) => {
        let {
            accountReceiver,
            money,

        } = req.body;
        let userReceiver = null;
        if (!accountReceiver) {
            return next({ error: { message: 'account is not exists', code: 422 } });
        }

        try {
            userReceiver = await bankAccount.findOne({ accountNumber: accountReceiver });
            if (userReceiver == null) {
                next({ error: { message: "Invalid data", code: 422 } });
                return;
            }

            userReceiver.currentBalance = +userReceiver.currentBalance + +money;
            await userReceiver.save();
            res.status(200).json({ result: userReceiver });


        } catch (error) {
            next(error);

        }


    },

    testPgp: async (req, res, next) => {

        const passphrase = `123456`;
        await openpgp.initWorker({ path: 'openpgp.worker.js' }) // set the relative web worker path

        const options = {
            message: openpgp.message.fromText('hello'),       // input as Message object
            publicKeys: (await openpgp.key.readArmored(partner.publicKeyArmored)).keys, // for encryption
        }
        console.log(options);
        const { data: encrypted } = await openpgp.encrypt(options);

        res.status(200).json({ result: true });


    }





}


