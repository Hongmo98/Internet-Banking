
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const user = mongoose.model("user");
const receiverInfo = mongoose.model("receiverInfo");
const transaction = mongoose.model("transaction");

var createError = require('http-errors')
var bcrypt = require("bcrypt");
const config = require('./../config/key');

const ObjectId = mongoose.Types.ObjectId;

const mailer = require("../utils/Mailer");
const otp = require("../utils/otp");

module.exports = {
    requestReceiver: async (req, res, next) => {
        let { userId } = req.tokePayload;
        let { receiverNumber } = req.query;

        try {
            let sender = await bankAccount.findOne({ userId });

            if (sender == null) {
                next({ error: { message: "Invalid data", code: 422 } });
                return;
            }
            let userReceiver = await bankAccount.findOne({ accountNumber: receiverNumber })

            if (userReceiver == null) {
                next({ error: { message: "Invalid data", code: 422 } });
                return;
            }
            let nameReceiver = userReceiver.accountName;
            let receiverInfo = { nameReceiver, receiverNumber, sender };

            res.status(200).json({ result: receiverInfo })
        } catch (err) {
            next(err);
        }


    },

    transferInternal: async (req, res, next) => {

        let { userId } = req.tokePayload;
        let userSender = await bankAccount.findOne({ userId: ObjectId(userId) })
        if (userSender === null) {
            next({ error: { message: "Not found account number", code: 422 } });
        }

        if (
            typeof req.body.receiver === "undefined" ||
            typeof req.body.amountMoney === "undefined" ||
            typeof req.body.content === "undefined" ||
            typeof req.body.typeSend === "undefined"

        ) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }
        // {
        //     "receiver": "02410001612496 ",
        //     "amountMoney":200000,
        //     "content" :"t chuyển cho m nè hehe",
        //     "typeSend" :"+",
        // }
        let { receiver, amountMoney, content, typeSend } = req.body;
        let currentUser = null;
        if (typeSend === '+' || typeSend === '-') {

            let userReceiver = await bankAccount.findOne({ accountNumber: receiver });
            if (userReceiver === null) {
                next({ error: { message: "Not found account number", code: 422 } });
                return;
            }


            let token = otp.generateOTP();

            mailer.sentMailer("mpbank.dack@gmail.com", { email: userSender.email }, "confirm", token)
                .then(async (json) => {

                    let newTransaction = new transaction({
                        bankAccountSender: userSender.accountNumber,
                        bankAccountReceiver: receiver,
                        amount: amountMoney,
                        content: content,
                        typeSend: typeSend,
                        typeTransaction: "TRANSFER",
                        fee: 2200,
                        CodeOTP: token,
                        status: "PROGRESS"

                    })


                    console.log(json);
                    try {
                        await newTransaction.save();
                        console.log(newTransaction)
                    } catch (err) {
                        next(err);
                        return;
                    }

                    res.status(200).json({ result: newTransaction });
                })
                .catch((err) => {
                    next(err);
                    return;
                });



        }
    },
    verifyOTP: async (req, res, next) => {
        let { userId } = req.tokePayload;
        console.log(req.body.code);
        if (
            typeof req.body.code === 'undefined'

        ) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }

        let { code, type } = req.body;


        try {
            let tran = await transaction.findOne({ CodeOTP: code });

            if (tran === null) {
                next({ error: { message: "not code correct", code: 422 } });
                return;
            }
            let userSender = await bankAccount.findOne({ accountNumber: tran.bankAccountSender });

            if (userSender == null) {
                next({ error: { message: "invalid correct", code: 422 } });
            }

            let userReceiver = await bankAccount.findOne({ accountNumber: tran.bankAccountReceiver });
            if (userReceiver == null) {
                next({ error: { message: "invalid correct", code: 422 } });
            }
            let money = +tran.amount;
            console.log(money);
            let feeTransfer = +tran.fee;
            let service = money + feeTransfer + 50000;

            if (+userSender.currentBalance > service) {
                if (tran.typeSend === '+') {


                    userReceiver.currentBalance = +userReceiver.currentBalance + money - feeTransfer;

                    userSender.currentBalance = + userSender.currentBalance - money;
                }
                else {
                    userReceiver.currentBalance = +userReceiver.currentBalance + money;

                    userSender.currentBalance = + userSender.currentBalance - money - feeTransfer;
                }
                tran.CodeOTP = "";
                tran.status = "SUCCESS";
                await userReceiver.save();
                console.log(userReceiver);
                await userSender.save();
                console.log(userSender);
                await tran.save();
                console.log(tran);

                let pro = { userReceiver, userSender, tran };
                res.status(200).json({ result: pro, type });

            } else {
                next({ error: { message: "current balance isn't to transfer money", code: 422 } });
            }

        } catch (err) {
            next(err);
            return;


        }
    },

    saveReceive: async (req, res, next) => {
        let { userId } = req.tokePayload;
        let { accountNumber, accountName } = req.body

        if (
            typeof req.body.accountNumber === 'undefined' ||
            typeof req.body.accountName === 'undefined'

        ) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }

        let saveInfo = new receiverInfo({
            numberAccount: accountNumber,
            nameAccount: accountName,
            userId: userId

        })
        try {

            await saveInfo.save();
            res.status(200).json({ result: saveInfo });
        } catch (err) {
            next(err);
        }

    },
    receiverTransfer: async (req, res, nex) => {
        let { userId } = req.tokePayload;
        try {
            let receiver = await receiverInfo.find({ userId: ObjectId(userId) });

            res.status(200).json({ result: receiver });

        }
        catch (err) {


        }


    }
}












