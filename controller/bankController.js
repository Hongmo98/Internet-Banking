var bcrypt = require("bcrypt");
var openpgp = require('openpgp');
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const transaction = mongoose.model("transaction");
const saveSign = mongoose.model("saveSign");
const partner = require('./../config/partner');
const ObjectId = mongoose.Types.ObjectId;

module.exports = {

    queryAccountInformation: async (req, res, next) => {

        let { account } = req.body;
        let timeStamp = Date.now()
        console.log("time:", timeStamp);

        let sig = account + partner.Security_key + req.headers['headerts'];

        let signature = bcrypt.hashSync(sig, 10);

        console.log(signature);
        if (req.headers['partnercode'] === partner.Partner_CodeN || req.headers['partnercode'] === partner.Partner_CodeQ) {

            let time = +req.headers['headerts'].toString() + 60000;
            if (+time > +timeStamp) {

                if (bcrypt.compareSync(sig, req.headers['headersig'])) {
                    try {
                        if (!account) {
                            return next({ error: { message: 'account is not exists' } });
                        }

                        let accountNumber = await bankAccount.findOne({ accountNumber: account });
                        if (accountNumber === null) {
                            next({ error: { message: "Invalid data" } });
                            return;
                        }
                        //hash khi tra ve 
                        let user = accountNumber.accountName;
                        res.status(200).json({ result: user });
                    } catch (err) {
                        next(err);
                    }
                } else {
                    next({ error: { message: 'The file has been edited' } });
                }
            } else {
                next({ error: { message: 'time expire ' } });
            }

        }
        else {
            next({ error: { message: ' link unsuccess ' } });
        }


    },

    transactionAccount: async (req, res, next) => {

        let { signature, accountReceiver, money } = req.body;
        await openpgp.initWorker({ path: 'openpgp.worker.js' })

        if (typeof signature === undefined || typeof accountReceiver === undefined || typeof money === undefined) {
            return next({ error: { message: 'Invalid value', code: 602 } });
        }

        let public;
        let timeStamp = Date.now()
        let sig = accountReceiver + partner.Security_key + req.headers['headerts'];

        if (req.headers['partnercode'] === partner.Partner_CodeN || req.headers['partnercode'] === partner.Partner_CodeQ) {

            let time = +req.headers['headerts'] + 60000;

            if (+time > +timeStamp) {

                if (bcrypt.compareSync(sig, req.headers['headersig'])) {
                    try {
                        if (req.headers['partnercode'] === partner.Partner_CodeQ) {
                            public = partner.pub;

                        } else {
                            public = partner.publicbank;

                        }

                        const { keys: [privateKey] } = await openpgp.key.readArmored(partner.privatebank);
                        await privateKey.decrypt(partner.passphrase);

                        const verified = await openpgp.verify({
                            message: openpgp.cleartext.fromText('Nap tien '),
                            signature: await openpgp.signature.readArmored(signature),
                            publicKeys: (await openpgp.key.readArmored(public)).keys
                        });

                        const { valid } = verified.signatures[0];
                        if (valid) {
                            let link = new saveSign({
                                respone: req.body,
                                sign: signature,
                                time: req.headers['headerts'],
                                type: 1,
                            });

                            await link.save();

                            userReceiver = await bankAccount.findOne({ accountNumber: accountReceiver });

                            if (userReceiver == null) {
                                next({ error: { message: "Invalid data" } });
                                return;
                            }

                            userReceiver.currentBalance = +userReceiver.currentBalance + +money;
                            await userReceiver.save();

                            const { signature: signatureMBP } = await openpgp.sign({
                                message: openpgp.cleartext.fromText('Hello, World!'),
                                privateKeys: [privateKey],
                                detached: true
                            });
                            let userName = userReceiver.accountName;
                            let obj = { userName, signatureMBP }
                            res.status(200).json({ result: obj });


                        } else {
                            return next({ error: { message: 'connect unsuccess' } });
                        }
                    } catch (error) {
                        next({ error: { message: "not link bank" } });

                    }
                }
                else {
                    next({ error: { message: 'The file has been edited' } });
                }

            }
            else {
                next({ error: { message: 'time expire ' } });
            }
        }
        else {
            next({ error: { message: ' link unsuccess ' } });
        }
    },






}



