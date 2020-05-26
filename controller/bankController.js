var bcrypt = require("bcrypt");
var openpgp = require('openpgp');
var createError = require('http-errors')
const moment = require("moment");
const CryptoJS = require("crypto-js");
const axios = require("axios");
const crypto = require('crypto');
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const transaction = mongoose.model("transaction");
const linkedBank = mongoose.model("linkedBank");
const saveSign = mongoose.model("saveSign");
const information = mongoose.model("information");
const config = require('./../config/key');
const ObjectId = mongoose.Types.ObjectId;

module.exports = {

    queryAccountInformation: async (req, res, next) => {

        let { account, } = req.body;
        let timeStamp = Date.now()
        console.log("hehe", config.SECRET_KEY)
        let infoBank = await information.findOne({ secrekey: config.SECRET_KEY });

        console.log("mo", infoBank);


        let sig = account + infoBank.secrekey + req.headers['headerts'];

        if (req.headers['partnercode'] === infoBank.codePGP || req.headers['partnercode'] === codeRSA) {

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

        await openpgp.initWorker({ path: 'openpgp.worker.js' })
        let { signature, accountReceiver, money } = req.body;

        let infoBank = await information.findOne({ secrekey: config.SECRET_KEY });

        if (typeof signature === undefined || typeof accountReceiver === undefined || typeof money === undefined) {

            throw createError(602, 'Invalid value');
        }


        let timeStamp = Date.now()
        let sig = accountReceiver + infoBank.secrekey + req.headers['headerts'];

        if (req.headers['partnercode'] === infoBank.codePGP || req.headers['partnercode'] === infoBank.codeRSA) {

            let time = +req.headers['headerts'] + 60000;

            if (+time > +timeStamp) {

                if (bcrypt.compareSync(sig, req.headers['headersig'])) {
                    try {
                        let connectBank = await linkedBank.findOne({ partnerMe: req.headers['partnercode'] });

                        ;
                        const { keys: [privateKey] } = await openpgp.key.readArmored(infoBank.code);
                        await privateKey.decrypt(infoBank.password);


                        const verified = await openpgp.verify({
                            message: openpgp.cleartext.fromText('Nap tien '),
                            signature: await openpgp.signature.readArmored(signature),
                            publicKeys: (await openpgp.key.readArmored(connectBank.public)).keys
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
                                throw createError(422, 'cannot find account ');

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

                            let message = "transaction success "
                            let obj = { message, userName, time, signatureMBP }
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
    linkBankPartnerPGP: async (req, res, next) => {

        // linkRSA: String,
        // linkPGP: String,
        try {
            let link = new information({
                secrekey: config.SECRET_KEY,
                code: privatebank,
                codePGP: process.env.CODE_PGP,
                codeRSA: process.env.CODE_RSA,
                name: "MPBank",
                password: "hongmo",
                linkRSA: privateRsa,
                linkPGP: privateKeyArmored,
            });

            let bank = await link.save();
            // let MPBBank = {
            //     nameBank: partner.Name,
            //     publicKey: partner.publicbank,
            //     codeBank: partner.partnercode,
            //     secretKey: partner.Security_key,
            //     link
            // };
            res.status(200).json({ result: bank });
        }
        catch (err) {
            next(err);
        }

    },


    linkBankPartnerTransferPgp: async (req, res, next) => {


        const partner_code = req.headers["partner_code"];
        let infoBank = await information.findOne({ secrekey: config.SECRET_KEY });

        const timestamp = moment().toString();

        const data = req.body;
        const secret_key = config.SECRET_KEY;
        console.log(data);
        const hash = CryptoJS.AES.encrypt(
            JSON.stringify({ data, timestamp, secret_key }),
            secret_key
        ).toString();

        const _headers = {
            partner_code: partner_code,
            timestamp: timestamp,
            api_signature: hash,
        };

        try {

            if (data.transaction_type === "+" || data.transaction_type === "-") {

                (async () => {

                    const {
                        keys: [privateKey],
                    } = await openpgp.key.readArmored(infoBank.linkPGP);
                    await privateKey.decrypt(config.passphrase);

                    const { data: cleartext } = await openpgp.sign({
                        message: openpgp.cleartext.fromText(JSON.stringify(data)),
                        privateKeys: [privateKey],
                    });

                    signed_data = cleartext;
                    console.log(signed_data);

                    // POST to NKLBank server
                    axios
                        .post(
                            "https://nklbank.herokuapp.com/api/partnerbank/request",
                            { data, signed_data },
                            { headers: _headers }
                        )
                        .then(function (response) {

                            res.status(200).json(response.data);
                            // console.log(response.data)
                        })
                        .catch(function (error) {
                            console.log(error.response);
                            res.status(error.response.status).send(error.response.data);
                        });
                })();
            }
        }
        catch (err) {
            next(err);
        }


    },
    linkBankPartnerRsa: async (req, res, next) => {

        let { account_number } = req.query;

        let data = { account_number };

        console.log(data);

        let timestamp = moment().unix();
        console.log(timestamp);



        let _data = JSON.stringify(data, null, 2);
        console.log(_data);
        console.log(crypto.createHash('sha256').update(timestamp + _data + config.SECRET_KEY).digest('hex'));
        axios({
            method: 'get',
            url: '/api/v1/linked/account',
            baseURL: 'https://s2q-ibanking.herokuapp.com',
            headers: { timestamp, security_key: config.SECRET_KEY },
            data: {
                data,
                hash: crypto.createHash('sha256').update(timestamp + _data + config.SECRET_KEY).digest('hex')
            }
        }).then(function (response) {
            res.status(200).json(response.data);
            console.log(response);
        }).catch(err => res.send(err));

    },

    transferRsa: async (req, res, next) => {
        let { account_number, amount } = req.body;
        let data = {
            account_number,
            amount
        };
        console.log(data)
        let timestamp = moment().unix();

        let _data = JSON.stringify(data, null, 2);

        let infoBank = await information.findOne({ secrekey: config.SECRET_KEY });
        const signer = crypto.createSign('sha256');
        signer.update(_data);
        const signature = signer.sign(infoBank.linkRSA, 'hex');
        console.log(signature);
        axios({
            method: 'post',
            url: '/api/v1/linked/account',
            baseURL: 'https://s2q-ibanking.herokuapp.com',
            headers: { timestamp, security_key: config.SECRET_KEY },
            data: {
                data,
                hash: crypto.createHash('sha256').update(timestamp + _data + config.SECRET_KEY).digest('hex'),
                signature
            }
        }).then(async response => {

            let link = new saveSign({
                respone: response.data,
                sign: response.data.sig,
                time: response.data.timestamp,
                type: 0,
            });
            await link.save();
            res.status(200).json(response.data);

        }).catch(err => res.send(err));


    },





}



