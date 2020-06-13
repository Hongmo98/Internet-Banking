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
const mailer = require("../utils/Mailer");
const otp = require("../utils/otp");


const private = `-----BEGIN RSA PRIVATE KEY-----
MIICWgIBAAKBgFHQ+NlOAcSzcr41rFJ8lX0K9tTHsYziDhIt0mBC4/X5iuAkBma6
uuhZhkMfyzoFj7SPc4DDNyBR21nYJjxa2JNadiLi7y6dD05TQQcpwmcfaIJWTvPM
kNeWtx0sDnlDtgdmDIwpXKLy4v/cqC+f9dhdm0WECUjr78FvDdY+baBhAgMBAAEC
gYAic7nmX7fU6a++swFOdtHIJu7LqQ92ANbmBs+Y43H06VD2k5Tye10rbE9iQqgk
VaUu5l0/8nRrMq0Ih0GKlsKtx9VLffDS5/uXrHMzNeLpa57JQGnB/EQcaAbYgkIE
4AHkE0BC37OakMGNPwksJmIbuE4DuaFn3Ay7zPIv6AZX8QJBAJ0ZCd3ELqJLSyuW
ss88qI+pCQS8WHuVeU8zTyAOMo6hhHrocXs7s57tj1jZNW+yCxuUojm1BzAinRpR
YGcWKKUCQQCFUwxkkpAP2wL6cbgOI8FW6OKCxkNbiZsczdppTERZ1KSQBoCNuyut
O8N+7z0hhbWeLgspQfWPo+tLJ18yElANAkAw+PM4bMXU1f/y8KGBNPme/yTOkyBK
NkiAxg/ugD6GdBdmcTufHPdbndbH7b5YuXn4+RaxQpuhB8lNwPx6Zk/5AkBPnrMN
9MD31xFGQ1dpikzR/C4ZbxGWvuzVHNJMg/FlvCmyoU9wVNDWmZQ8X98f/9vgZRrh
PrTJXVkM/qxJGMqZAkAmcWH2lZLzIP43Mu78eX/SfZNzLftfNRtSIuvWRYh+5KCD
kREzQ9qJaVXPvKoFjEHSJZK96vEtmvk+jmBNGfsN
-----END RSA PRIVATE KEY-----`
const baseURL = 'https://s2q-ibanking.herokuapp.com';
module.exports = {

    queryAccountInformation: async (req, res, next) => {

        let { account, } = req.body;
        let timeStamp = Date.now()
        console.log("hehe", config.SECRET_KEY)
        let infoBank = await information.findOne({ secrekey: config.SECRET_KEY });

        // console.log("mo", infoBank);


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
        let { signature, accountReceiver, money, content, typeSend, fee, nameBank, accountSender } = req.body;

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
                            let tranPartner = new transaction({
                                bankAccountSender: accountSender,
                                bankAccountReceiver: accountReceiver,
                                amount: money,
                                content: content,
                                typeSend: typeSend,
                                nameBank: nameBank,
                                typeTransaction: "GETMONEY",
                                status: "SUCCESS",
                                fee: 3300,

                            })

                            if (typeSend === true) {
                                userReceiver.currentBalance = +userReceiver.currentBalance + +money;
                            }
                            else {
                                userReceiver.currentBalance = +userReceiver.currentBalance + +money - fee;
                            }


                            await userReceiver.save();
                            await tranPartner.save();

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
            else {
                const request = (data, signed_data, _headers, res) =>
                    axios
                        .post(
                            "https://nklbank.herokuapp.com/api/partnerbank/request",
                            { data, signed_data },
                            { headers: _headers }
                        )
                        .then(function (response) {
                            res.status(200).json(response.data);
                            console.log(response.data);
                        })
                        .catch(function (error) {
                            console.log(error.response);
                            res.status(error.response.status).send(error.response.data);
                        });
                request(data, null, _headers, res);
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

    linkBankAccount: async (req, res, next) => {
        let { userId, role } = req.tokePayload;

        let sender = await bankAccount.findOne({ userId });
        let numberSender = sender.accountNumber;
        console.log(numberSender);

        if (sender == null) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }
        let newTransaction = null;
        // {
        //     "nameBank":"NKLBank",
        //     "receiver":"12345",
        //     "typeSend":true,
        //     "amountMoney":20000,
        //     "content":"hehe"
        // }
        const partner_code = req.headers["partner_code"];
        let { nameBank, content, amountMoney, receiver, typeSend } = req.body;
        if (nameBank === "NKLBank") {
            let infoBank = await information.findOne({ secrekey: config.SECRET_KEY });
            const timestamp = moment().toString();
            let transaction_type = '?';
            let source_account = '3234';
            let target_account = receiver;
            const data = { transaction_type, source_account, target_account };
            const secret_key = config.SECRET_KEYRSA;
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

                const request = (data, signed_data, _headers, res) =>
                    axios
                        .post(
                            "https://nklbank.herokuapp.com/api/partnerbank/request",
                            { data, signed_data },
                            { headers: _headers }
                        )
                        .then(async function (response) {
                            newTransaction = new transaction({
                                bankAccountSender: numberSender,
                                bankAccountReceiver: target_account,
                                amount: amountMoney,
                                content: content,
                                typeTransaction: "TRANSFER",
                                fee: 2200,
                                CodeOTP: "",
                                status: "PROGRESS",
                                timeOTP: Date.now(),
                                nameBank: nameBank,
                                typeSend: typeSend,
                            })
                            await newTransaction.save();
                            let info = response.data;
                            console.log(newTransaction)
                            let data = { newTransaction, sender, info }
                            res.status(200).json({ result: data });
                            // res.status(200).json({ result: info })


                        })
                        .catch(function (error) {
                            next(error.response);

                        });
                request(data, null, _headers, res);


            }

            catch (err) {
                next(err);
            }
        }
        else {
            let account_number = receiver;
            let dataInfo = await getInfo(account_number);
            console.log("dataInfo", dataInfo);
            newTransaction = new transaction({
                bankAccountSender: numberSender,
                bankAccountReceiver: receiver,
                amount: amountMoney,
                content: content,
                typeTransaction: "TRANSFER",
                fee: 3300,
                CodeOTP: "",
                status: "PROGRESS",
                timeOTP: Date.now(),
                nameBank: nameBank,
                typeSend: typeSend
            })
            await newTransaction.save();

            console.log(newTransaction)
            let data = { newTransaction, sender, dataInfo }
            res.status(200).json({ result: data });


        }

    },
    transferBankAccount: async (req, res, next) => {
        let { userId } = req.tokePayload;
        let userSender = await bankAccount.findOne({ userId: ObjectId(userId) })
        if (userSender === null) {
            next({ error: { message: "Not found account number", code: 422 } });
        }
        let sender = userSender.bankAccountSender;
        let email = userSender.email;
        console.log(userSender);


        if (
            typeof req.body.idTransaction === "undefined"

        ) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }
        //  {"idTransaction":""}
        let { idTransaction } = req.body;

        console.log(req.body);
        let userReceiver = await transaction.findById({
            _id: idTransaction
        });

        if (userReceiver === null) {
            next({ error: { message: "Not found account number", code: 422 } });
            return;
        }
        console.log(userReceiver);

        let token = otp.generateOTP();
        console.log(token);

        let time = Date.now();
        console.log(time);

        mailer.sentMailer("mpbank.dack@gmail.com", { email }, "transfer", token)
            .then(async (json) => {
                userReceiver.CodeOTP = token;
                userReceiver.timeOTP = time;
                console.log(json);
                try {
                    await userReceiver.save();
                    console.log(userReceiver)
                } catch (err) {
                    next(err);
                    return;
                }

                res.status(200).json({ message: "send otp email " });
            })
            .catch((err) => {
                next(err);
                return;
            });

    },
    // {"code ":"79944"}
    verifyOTP: async (req, res, next) => {

        let { userId } = req.tokePayload;

        if (
            typeof req.body.code === 'undefined'

        ) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }

        let { code } = req.body;
        try {
            let tran = await transaction.findOne({ CodeOTP: code });

            if (tran === null) {
                next({ error: { message: "not code correct", code: 422 } });
                return;
            }
            console.log("tran", tran);

            let accountReceiver = tran.bankAccountReceiver;

            let amount = tran.amount;
            let timeOTP = Date.now();
            let timestamp = Date.parse(tran.timeOTP) + 600000;
            console.log("mo", Date.parse(tran.timeOTP));
            // console.log(timeOTP);

            let userSender = await bankAccount.findOne({ accountNumber: tran.bankAccountSender });
            console.log(userSender);
            if (userSender == null) {
                next({ error: { message: "invalid correct", code: 422 } });
            }


            if (tran.nameBank === 'NKLBank') {

                const partner_code = "MtcwLbASeIXVnKurQCHrDCmsTEsBD7rQ44wHsEWjWtl8k";
                let infoBank = await information.findOne({ secrekey: config.SECRET_KEY });
                // console.log(infoBank);

                const timestamp = moment().toString();
                let transaction_type = '+';
                let source_account = '3234';
                let target_account = accountReceiver;
                let amount_money = amount;
                const data = { transaction_type, source_account, target_account, amount_money };

                const secret_key = config.SECRET_KEY;
                // console.log(data);
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

                            axios
                                .post(
                                    "https://nklbank.herokuapp.com/api/partnerbank/request",
                                    { data, signed_data },
                                    { headers: _headers }
                                )
                                .then(async function (response) {
                                    let transfer = await getSenderMoney(response.data, tran, userSender);
                                    let link = new saveSign({
                                        respone: response.data,
                                        sign: response.data.sign,
                                        time: Date.now(),
                                        type: 0,
                                    });
                                    await link.save();
                                    res.status(200).json({ result: transfer, msg: 'transfer success', link });

                                })
                                .catch(function (error) {
                                    console.log(error.response);
                                    // res.status(error.response.status).send(error.response.data);
                                });
                        })();


                    }
                    else {
                        next({ error: { message: "invalid correct", code: 422 } });
                    }

                } catch (err) {
                    next(err);
                }
            }
            if (tran.nameBank === 'S2QBank') {

                const transfer = await sendMoney(tran);
                console.log("hhe", transfer);
                let moneyUser = await getSenderMoney(transfer, tran, userSender);

                let link = new saveSign({
                    respone: transfer,
                    sign: transfer.signature,
                    time: Date.now(),
                    type: 0,
                });
                await link.save();
                res.status(200).json({ result: moneyUser, msg: 'transfer success', link });



            }


        } catch (err) {
            next(err);
        }
    },
    infomationU: async (req, res, next) => {
        let id = req.body.id;
        let a = await information.findById(id);
        a.linkRSA = private;
        a.partnerRSA = config.SECRET_KEYRSA;
        await a.save();
        res.status(200).json({ result: a });

    },

}
getSenderMoney = async (data, tran, sender) => {
    let senderMoney = +sender.currentBalance;
    let money = +tran.amount;
    let fee = +tran.fee;
    // console.log('money', money);
    let total = senderMoney - money - fee;
    sender.currentBalance = total;
    await sender.save();
    tran.CodeOTP = "";
    tran.status = "SUCCESS";
    await tran.save()

    let transfer = { data, tran, sender };
    // console.log(transfer)
    return transfer;

};


const sendMoney = async (tran) => {
    console.log(tran);
    let timestamp = moment().unix();
    let infoBank = await information.findOne({ secrekey: config.SECRET_KEY });
    let security_key = infoBank.partnerRSA;
    let data = {
        source_account: tran.bankAccountSender,
        destination_account: tran.bankAccountReceiver,
        source_bank: 'MPBank',
        description: tran.content,
        feePayBySender: tran.typeSend,
        fee: 3300,
        amount: tran.amount
    };
    let _data = JSON.stringify(data);
    try {
        // create signature

        let signer = crypto.createSign('sha256');
        signer.update(_data);
        let signature = signer.sign(infoBank.linkRSA, 'hex');

        // send request
        let result = await axios({
            method: 'post',
            url: 'public/transfer',
            baseURL: baseURL,
            headers: {
                timestamp,
                security_key,
                hash: crypto.createHash('sha256').update(timestamp + _data + security_key).digest('hex')
            },
            data: {
                data,
                signature,
            }
        });
        return result.data;
    } catch (error) {
        console.log(error.response.status);
        console.log(error.response.message);
    }
};
const getInfo = async (account_number) => {
    let timestamp = moment().unix();
    let security_key = config.SECRET_KEY;
    let _data = JSON.stringify(account_number);
    try {
        let response = await axios({
            method: 'get',
            url: `public/${account_number}`,
            baseURL: baseURL,
            headers: {
                timestamp,
                security_key,
                hash: crypto.createHash('sha256').update(timestamp + _data + security_key).digest('hex')
            }
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
}



