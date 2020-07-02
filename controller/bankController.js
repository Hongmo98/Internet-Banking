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
const receiverInfo = mongoose.model("receiverInfo");
const config = require('./../config/key');
const ObjectId = mongoose.Types.ObjectId;
const mailer = require("../utils/Mailer");
const otp = require("../utils/otp");
const redis = require("redis");
// const src = 'redis-13088.c8.us-east-1-2.ec2.cloud.redislabs.com:13088';
const client = redis.createClient('13088', 'redis-13088.c8.us-east-1-2.ec2.cloud.redislabs.com', { no_ready_check: true });
client.auth('Z9qiKNw7XcCx1AgrFJMdpC81DO8Betle', function (err) {

});

const pub = `-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: Keybase OpenPGP v1.0.0\nComment: https://keybase.io/crypto\n\nxo0EXsSoRgEEAMY1xjujGbJflS/dzCjPw1CcZVPr5vMxOXcS7IXA4Qp4Ndsa/pPa\n26r1NNafBxfJ/lkSBj/KWGFPqsjd6U25LY2VsNeWgh9bct7tTQN0m9pOBU9Iu6tu\nm+gBbNell5XmT58dL3HAowB+7/oIFRkd5oQzv5WS4gSuZLn5mk+EP+/VABEBAAHN\nInMycSA8YXF1YXJpdXMuc3VwZXJzdGFyQGdtYWlsLmNvYT7CrQQTAQoAFwUCXsSo\nRgIbLwMLCQcDFQoIAh4BAheAAAoJEDu4fPTvbOqwjR8D/ixHYS2mFBiRbu3Ug40l\nCLXOE2yj9yeDG46HCk2dPVfLzECKA65GqHafVWLK/UaN9jXSkGZS5Sqb6LXCX0IZ\ng1QG6TWhLqX0ZkXmln7HV5hoaDpwgSz4cInYYcvvqN7AR3HmYl0A6AFwlsc3jc11\ndjIJMZK7dAaLE+QjG2i0DWWZzo0EXsSoRgEEANstPC8XvKdPT9iRUPlYYp+UhSI8\nBS08InoxXgzZSajjnMhg7RcJKIqRkTebjYfmzPnWfeuypQ5vOakU4HqyCReRhTtG\ngH/ifWEueJxK3IbQieXmooH4G/Z0461Hu8IRVAJ23RqRxzQ9M/Nse+1Wu3q80//F\npm55Yiy9DWzT+63VABEBAAHCwIMEGAEKAA8FAl7EqEYFCQ8JnAACGy4AqAkQO7h8\n9O9s6rCdIAQZAQoABgUCXsSoRgAKCRCFvqQSd53migEXA/98RpHKCbHHpLuKcjBi\nn8D9WlZunKvj8mWsE2Ftkt7H4RcyR2hDgcr+oFgu9ADe/Ll8s7L2cQYet+BbKycg\ne00z9evwiNExPrlZww3BRLsy3q3Uy7Anv7mCCdArVpOKoL7XGj9tCNs89v5C8GWE\nLxiUFmCQzWM3Os6wR9SNjgJkBy1NA/9xE3m0Y7x2L9F5R/GSJA1vVr1Ac0FuJ9Ly\nqJSzdE1y+r96PtpBfjhOFpk66EIey7EzZVmbAQ/Kd6mvbMWb6wDZe/RDWUMRa3XY\n5m1bHRdbHdKgkW207FtdLC7sJbjK6xOdYMKbjionYTd9Lm/O9I1qn838Xn1wVfxd\nWE4u6pMGOc6NBF7EqEYBBADFKe9ofAyxC3xuZXmPDpB4fVZvNbJC9kD7jpSGF3hQ\nWVbZs919ayEa8TN4Gfc55o7/EdOhwOIFE2Z4jeKqCg4pHB2ke72f+yIKpNc9EtT4\nj9i3ca7U68lMhKiyYIg/UymxfUIm94FI8FF37gmRwX3T9l/XVa52RNtgBxhlhtIH\nOQARAQABwsCDBBgBCgAPBQJexKhGBQkPCZwAAhsuAKgJEDu4fPTvbOqwnSAEGQEK\nAAYFAl7EqEYACgkQD5yWPgOTuIJa1gP/SbAIEmA9oN4cv76IbKggQbwAnS6hwEcn\nzTNa1jfmma3dty5mQ3GjK3ENc4GKqyfy9Pyi2BPLLcsu78mAcqwEtnuhd8mnZuSm\nXSG7E2T/LhIP5EbGecKpk9eF9fNKrxVTd8D2qNvxefGJcifby81bGMMRYuu9Zl9Y\nLd8LdseGd1AZVwP+JS8IgIWEIfAG/Q+nuEAoC98ze5tbyJUqgxBn56tbwU1+txzr\n43+aoUDKL00HUaM5N3IaTUpMayh3ooy+lWoQipPmHal3UkMHmpyDDi7QJcDUQlh6\nbh3tyULIj1Bwr6W1wq6HqV4eUSuSPBfljHTvTq2VEmD1gTddJ8Tiq2F9A3Y=\n=3bra\n-----END PGP PUBLIC KEY BLOCK-----`

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
                            let totalTransaction = null;

                            if (typeSend === true) {
                                userReceiver.currentBalance = +userReceiver.currentBalance + +money;
                                totalTransaction = +money;

                            }
                            else {
                                userReceiver.currentBalance = +userReceiver.currentBalance + +money - fee;
                                totalTransaction = +money + fee;
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
                                totalTransaction: totalTransaction

                            })
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

        if (
            typeof req.body.receiver === "undefined" ||
            typeof req.body.nameBank === "undefined" ||
            typeof req.body.typeSend === "undefined" ||
            typeof req.body.amountMoney === "undefined"

        ) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }

        let sender = await bankAccount.findOne({ userId });
        let numberSender = sender.accountNumber;
        let email = sender.email;



        if (sender == null) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }


        let token = otp.generateOTP();
        console.log('token', token);
        let format = formatEmail(token);

        const partner_code = "MtcwLbASeIXVnKurQCHrDCmsTEsBD7rQ44wHsEWjWtl8k";
        let { nameBank, content, amountMoney, receiver, typeSend } = req.body;
        if (content === ' ') {
            content = `${sender.accountName} transfer`;
        }
        console.log(req.body)


        if (nameBank === "NKLBank") {

            const timestamp = moment().toString();
            let transaction_type = '?';
            let source_account = numberSender;
            let target_account = receiver;
            const data = { transaction_type, source_account, target_account };

            const secret_key = config.SECRET;
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
            console.log(_headers);

            try {

                const request = (data, signed_data, _headers, res) =>
                    axios
                        .post(
                            "https://nklbank.herokuapp.com/api/partnerbank/request",
                            { data, signed_data },
                            { headers: _headers }
                        )
                        .then(async function (response) {
                            let info = response.data;
                            let fullName = info.fullname;

                            client.setex(userId, 100, token, function (err) {

                                console.error(err);
                            });
                            mailer.sentMailer("mpbank.dack@gmail.com", { email }, "transfer MP bank", format)
                                .then(async (json) => {
                                    let dataReceiver = { content, amountMoney, typeSend, nameBank }
                                    let data = { sender, info, fullName, dataReceiver, message: "send otp email " }

                                    console.log(json);
                                    res.status(200).json({ result: data });

                                })
                        })
                        .catch(function (error) {
                            // next(error.response.data);
                            console.log('1', error);
                            console.log('2', error.response.data.msg);
                            next({ error: { message: error.response.data.msg, code: 422 } });
                            return;


                        });
                request(data, null, _headers, res);


            }

            catch (err) {
                next(err);
            }
        }
        if (nameBank === "S2QBank") {

            let account_number = receiver;
            let info = await getInfo(account_number);

            if (info === 'Error') {
                next({ error: { message: "not found account", code: 422 } });
                return;
            }
            let fullName = info.full_name;
            console.log('hdhdhdh', info)
            client.setex(userId, 300, token, function (err) {

                console.error(err);
            });
            mailer.sentMailer("mpbank.dack@gmail.com", { email }, "transfer MP bank", format)
                .then(async (json) => {
                    let dataReceiver = { content, amountMoney, typeSend, nameBank, receiver }
                    let data = { sender, fullName, dataReceiver, message: "send otp email " }

                    console.log(json);


                    res.status(200).json({ result: data });
                })
        }



    },

    verifyOTP: async (req, res, next) => {

        let { userId } = req.tokePayload;

        if (
            typeof req.body.code === 'undefined'

        ) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }
        let { nameBank, content, amountMoney, receiver, typeSend, code } = req.body;
        console.log(req.body);
        try {
            let userSender = await bankAccount.findOne({ userId });
            console.log(userSender);
            if (userSender == null) {
                next({ error: { message: "invalid correct", code: 422 } });
            }
            client.get(userId, async function (err, value) {
                if (err) {
                    next({ error: { message: "time otp expire", code: 422 } });
                }
                console.log("mo", value);
                if (value === code) {

                    if (nameBank === 'NKLBank') {

                        const partner_code = "MtcwLbASeIXVnKurQCHrDCmsTEsBD7rQ44wHsEWjWtl8k";
                        let infoBank = await information.findOne({ secrekey: config.SECRET_KEY });
                        // console.log(infoBank);

                        const timestamp = moment().toString();
                        let transaction_type = '+';
                        let source_account = '3234';
                        let target_account = receiver;
                        let amount_money = amountMoney;
                        const data = { transaction_type, source_account, target_account, amount_money };
                        const secret_key = config.SECRET;
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
                        console.log(_headers);

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
                                    console.log(cleartext);

                                    axios
                                        .post(
                                            "https://nklbank.herokuapp.com/api/partnerbank/request",
                                            { data, signed_data },
                                            { headers: _headers }
                                        )
                                        .then(async function (response) {
                                            let transfer = await getSenderMoney(response.data, amountMoney, typeSend, userSender);
                                            console.log("transfer", transfer);
                                            if (transfer === "error") {
                                                next({ error: { message: "current balance not enough to transfer", code: 422 } });
                                                return;
                                            }

                                            let link = new saveSign({
                                                respone: response.data,
                                                sign: response.data.sign,
                                                time: Date.now(),
                                                type: 0,
                                            });
                                            let newTransaction = new transaction({
                                                bankAccountSender: userSender.accountNumber,
                                                bankAccountReceiver: target_account,
                                                amount: amountMoney,
                                                content: content,
                                                typeTransaction: "TRANSFER",
                                                fee: 3300,
                                                status: "SUCCESS",
                                                nameBank: nameBank,
                                                typeSend: typeSend,
                                                totalTransaction: transfer.totalTransaction
                                            })
                                            await newTransaction.save();
                                            await link.save();
                                            let re = await receiverInfo.findOne({ numberAccount: receiver });
                                            let type = false;
                                            if (re === null) {
                                                type = true;
                                            }
                                            let data = { newTransaction, link, partner: response.data, transfer, msg: 'transfer success', type }
                                            res.status(200).json({ result: data });

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
                    if (nameBank === 'S2QBank') {

                        const transfer = await sendMoney(content, amountMoney, receiver, typeSend, userSender);
                        console.log("hhe", transfer);
                        let moneyUser = await getSenderMoney(transfer, amountMoney, typeSend, userSender);
                        console.log("moneyUser", moneyUser);
                        if (moneyUser === "error") {
                            next({ error: { message: "current balance not enough to transfer", code: 422 } });
                            return;
                        }
                        console.log(moneyUser);
                        let link = new saveSign({
                            respone: transfer,
                            sign: transfer.signature,
                            time: Date.now(),
                            type: 0,
                        });
                        let newTransaction = new transaction({
                            bankAccountSender: userSender.accountNumber,
                            bankAccountReceiver: receiver,
                            amount: amountMoney,
                            content: content,
                            typeTransaction: "TRANSFER",
                            fee: 3300,
                            status: "SUCCESS",
                            nameBank: nameBank,
                            typeSend: typeSend,
                            totalTransaction: moneyUser.totalTransaction
                        })
                        await newTransaction.save();
                        await link.save();
                        let re = await receiverInfo.findOne({ numberAccount: receiver });
                        let type = false;
                        if (re === null) {
                            type = true;
                        }
                        let data = { newTransaction, link, transfer, msg: 'transfer success', type }
                        res.status(200).json({ result: data });
                        // res.status(200).json({ transfer });



                    }
                } else {
                    next({ error: { message: "otp exit ", code: 422 } });
                }
            })
        }
        catch (err) {
            next(err);
        }
    },
    infomationU: async (req, res, next) => {
        // let id = req.body.id;
        // let a = await information.findById(id);
        // a.linkRSA = private;
        // a.partnerRSA = config.SECRET_KEYRSA;
        // await a.save();
        let id = req.body.id;
        let a = await linkedBank.findById(id);
        a.public = pub;
        a.partnerMe = 's2qbank';
        await a.save();
        res.status(200).json({ result: a });

    },
    getNameBankLink: async (req, res, next) => {

        try {
            let e = await linkedBank.find();

            res.status(200).json({ result: e });
        }
        catch (err) {
            next(err);
        }
    }
}
getSenderMoney = async (data, amountMoney, typeSend, sender) => {
    let senderMoney = +sender.currentBalance;
    let money = +amountMoney;
    let fee = 3300;
    let total = senderMoney - money
    let check = money + fee;
    let totalTransaction = null;
    if (sender.currentBalance > +check) {
        if (typeSend === false) {

            sender.currentBalance = total - fee;
            totalTransaction = money + fee;

        } else {
            sender.currentBalance = total;
            totalTransaction = money

        }
        await sender.save();

        let transfer = { data, sender, totalTransaction };
        // console.log(transfer)
        return transfer;
    } else {
        let msg = "error"
        return msg
    }

};


const sendMoney = async (content, amountMoney, receiver, typeSend, userSender) => {

    let timestamp = moment().unix();
    let infoBank = await information.findOne({ secrekey: config.SECRET_KEY });
    let security_key = infoBank.partnerRSA;
    let data = {
        source_account: userSender.accountNumber,
        destination_account: receiver,
        source_bank: 'MPBank',
        description: content,
        feePayBySender: typeSend,
        fee: 3300,
        amount: amountMoney
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
    let security_key = config.SECRET;
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
        console.log("err", error);
        return error.name;
    }
}

formatEmail = (token) => {
    let object = `
    You can use our Internet Banking services at our website "http://www.mpbank.com.vn" right after receiving this email.`

    let b = `This password will expire in 5 minutes..`

    let c = ` Do not reply to this automatically-generated email. If you have any questions, please contact MPBank Contact Center via number 0334994998 or our branches`

    let d = ` Thank you for using our services.`
    let a = '<p>You are making a bank transfer in MPBank Internet Banking. </b> <ul><li> Your transaction code is <h1>' + token + '</h1></li> <li>' + object + '</li> <li>' + b + '</li>  <li>' + c + '</li><li>' + d + '</li>  </ul>'

    return a;
}





