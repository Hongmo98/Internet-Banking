var bcrypt = require("bcrypt");
var openpgp = require('openpgp');
var createError = require('http-errors')
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const transaction = mongoose.model("transaction");
const linkedBank = mongoose.model("linkedBank");
const saveSign = mongoose.model("saveSign");
const partner = require('./../config/partner');
const ObjectId = mongoose.Types.ObjectId;

module.exports = {

    queryAccountInformation: async (req, res, next) => {

        let { account, nameBank } = req.body;
        let timeStamp = Date.now()
        console.log("time:", timeStamp);

        let sig = account + partner.Security_key + req.headers['headerts'];

        if (req.headers['partnercode'] === partner.Partner_codeN || req.headers['partnercode'] === partner.Partner_CodeQ) {

            let time = +req.headers['headerts'].toString() + 60000;
            if (+time > +timeStamp) {

                if (bcrypt.compareSync(sig, req.headers['headersig'])) {
                    try {

                        let accountNumber = await bankAccount.findOne({ accountNumber: account });
                        if (accountNumber === null) {

                            throw createError(422, 'Invalid data');
                            return;
                        }
                        //hash khi tra ve 
                        let user = accountNumber.accountName;
                        res.status(200).json({ result: user });
                    } catch (err) {
                        next(err);
                    }
                } else {

                    throw createError(422, 'The file has been edited');
                }
            } else {
                throw createError(408, 'time expire');
            }

        }
        else {
            throw createError(422, ' link unsuccess ');

        }


    },

    transactionAccount: async (req, res, next) => {

        let { signature, accountReceiver, money } = req.body;
        await openpgp.initWorker({ path: 'openpgp.worker.js' })

        if (typeof signature === undefined || typeof accountReceiver === undefined || typeof money === undefined) {

            throw createError(602, 'Invalid value');
        }


        let timeStamp = Date.now()
        let sig = accountReceiver + partner.Security_key + req.headers['headerts'];

        if (req.headers['partnercode'] === partner.Partner_codePGP || req.headers['partnercode'] === partner.partnercodeRSA) {

            let time = +req.headers['headerts'] + 60000;

            if (+time > +timeStamp) {

                if (bcrypt.compareSync(sig, req.headers['headersig'])) {
                    try {
                        let connectBank = await linkedBank.findOne({ partnerMe: req.headers['partnercode'] });

                        const { keys: [privateKey] } = await openpgp.key.readArmored(partner.privatebank);
                        await privateKey.decrypt(partner.passphrase);

                        const verified = await openpgp.verify({
                            message: openpgp.cleartext.fromText('Nap tien '),
                            signature: await openpgp.signature.readArmored(signature),
                            publicKeys: (await openpgp.key.readArmored(connectBank.public)).keys
                        });

                        const { valid } = verified.signatures[0];
                        console.log(valid);
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
                                throw createError(422, 'Invalid data');

                            }

                            userReceiver.currentBalance = +userReceiver.currentBalance + +money;
                            await userReceiver.save();

                            const { signature: signatureMBP } = await openpgp.sign({
                                message: openpgp.cleartext.fromText('Hello, World!'),
                                privateKeys: [privateKey],
                                detached: true
                            });

                            let userName = userReceiver.accountName;
                            let time = new Date();
                            let obj = { userName, signatureMBP, time }
                            res.status(200).json({ result: obj });


                        } else {

                            throw createError(422, 'connect unsuccess');
                        }
                    } catch (error) {

                        return next(error)


                    }
                }
                else {

                    throw createError(422, 'The file has been edited');

                }

            }
            else {

                throw createError(408, 'time expire ');

            }
        }
        else {
            throw createError(408, ' link unsuccess ');

        }
    },





}



