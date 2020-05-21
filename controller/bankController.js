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

        await openpgp.initWorker({ path: 'openpgp.worker.js' })

        let public;

        let timeStamp = Date.now()
        console.log("time:", timeStamp);

        let { signature, accountReceiver, money } = req.body;

        let sig = accountReceiver + partner.Security_key + req.headers['headerts'];
        let signature1 = bcrypt.hashSync(sig, 10);
        console.log(signature1);


        if (req.headers['partnercode'] === partner.Partner_CodeN || req.headers['partnercode'] === partner.Partner_CodeQ) {

            let time = +req.headers['headerts'].toString() + 60000;

            if (+time > +timeStamp) {

                if (bcrypt.compareSync(sig, req.headers['headersig'])) {
                    try {
                        if (req.headers['partnercode'] === partner.Partner_CodeQ) {
                            public = partner.pub;
                        } else {
                            public = partner.publicbank;
                        }

                        const { keys: [privateKey] } = await openpgp.key.readArmored(partner.privatebank);
                        await privateKey.decrypt(passphrase1);


                        const verified = await openpgp.verify({
                            message: openpgp.cleartext.fromText('Nap tien '),
                            signature: await openpgp.signature.readArmored(signature),
                            publicKeys: (await openpgp.key.readArmored(public)).keys
                        });

                        const { valid } = verified.signatures[0];
                        if (valid) {

                            if (!accountReceiver) {
                                return next({ error: { message: 'account is not exists' } });
                            }


                            userReceiver = await bankAccount.findOne({ accountNumber: accountReceiver });

                            if (userReceiver == null) {
                                next({ error: { message: "Invalid data" } });
                                return;
                            }

                            userReceiver.currentBalance = +userReceiver.currentBalance + +money;
                            await userReceiver.save();

                            const { signature: detachedSignature } = await openpgp.sign({
                                message: openpgp.cleartext.fromText('Hello, World!'),
                                privateKeys: [privateKey],
                                detached: true
                            });
                            let userName = userReceiver.accountName;
                            let obj = { userName, detachedSignature }
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




    testPgp: async (req, res, next) => {


        await openpgp.initWorker({ path: 'openpgp.worker.js' })

        const { keys: [privateKey] } = await openpgp.key.readArmored(partner.pri);
        await privateKey.decrypt(partner.passphrase);

        const { signature: detachedSignature } = await openpgp.sign({
            message: openpgp.cleartext.fromText('Nap tien'),
            privateKeys: [privateKey],
            detached: true
        });

        console.log(detachedSignature);
        res.status(200).json({ result: detachedSignature });


    },


}



