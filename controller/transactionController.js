
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

        if (
            typeof req.body.receiver === "undefined" ||
            typeof req.body.amountMoney === "undefined" ||
            typeof req.body.content === "undefined" ||
            typeof req.body.typeSend === "undefined"

        ) {
            next({ error: { message: "Invalid data", code: 422 } });
        }

        try {
            let sender = await bankAccount.findOne({ userId });


            if (sender == null) {
                next({ error: { message: "Invalid data", code: 422 } });
                return;
            }
            let accountSender = sender.accountNumber;
            let { receiver, amountMoney, content, typeSend } = req.body;
            console.log(req.body);
            let currentUser = null;
            if (typeSend === '+' || typeSend === '-') {

                let userReceiver = await bankAccount.findOne({ accountNumber: receiver });
                console.log(userReceiver);
                if (userReceiver === null) {
                    next({ error: { message: "Not found account number", code: 422 } });
                    return;
                }
                let nameReceiver = userReceiver.accountName;

                let newTransaction = new transaction({
                    bankAccountSender: accountSender,
                    bankAccountReceiver: receiver,
                    amount: amountMoney,
                    content: content,
                    typeSend: typeSend,
                    typeTransaction: "TRANSFER",
                    fee: 2200,
                    CodeOTP: "",
                    status: "PROGRESS",
                    timeOTP: Date.now(),

                })
                await newTransaction.save();

                let data = { newTransaction, sender, nameReceiver }
                res.status(200).json({ result: data });
            } else {
                next({ error: { message: "type  cannot  suit", code: 422 } });
                return;
            }

        } catch (err) {
            next(err);
        }


    },
    // {
    //     "receiver": "02410001612496 ",
    //     "amountMoney":200000,
    //     "content" :"t chuyển cho m nè hehe",
    //     "typeSend" :"+",
    // }    
    transferInternal: async (req, res, next) => {

        let { userId } = req.tokePayload;
        let userSender = await bankAccount.findOne({ userId: ObjectId(userId) })
        if (userSender === null) {
            next({ error: { message: "Not found account number", code: 422 } });
        }
        let sender = userSender.bankAccountSender;
        let email = userSender.email;


        if (
            typeof req.body.idTransaction === "undefined"

        ) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }

        let { idTransaction } = req.body;
        let currentUser = null;
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
    verifyOTP: async (req, res, next) => {
        let { userId } = req.tokePayload;
        console.log(req.body.code);
        if (
            typeof req.body.code === 'undefined'

        ) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }

        let { code } = req.body;

        // {
        //     "code": "527675",

        // }


        try {
            let tran = await transaction.findOne({ CodeOTP: code });

            if (tran === null) {
                next({ error: { message: "not code correct", code: 422 } });
                return;
            }
            console.log(tran);

            let timeOTP = Date.now();
            let timestamp = Date.parse(tran.timeOTP) + 600000;
            console.log("mo", Date.parse(tran.timeOTP));
            console.log(timeOTP);

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
                res.status(200).json({ result: pros });

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
    receiverTransfer: async (req, res, next) => {
        let { userId } = req.tokePayload;
        try {
            let receiver = await receiverInfo.find({ userId: ObjectId(userId), isDelete: false });


            res.status(200).json({ result: receiver });

        }
        catch (err) {


        }


    },
    deleteReceiver: async (req, res, next) => {
        if (typeof req.body.receiverId === 'undefined') {
            next({ error: { message: "Invalid data", code: 402 } });
            return;
        }

        let { receiverId } = req.body;
        let { userId } = req.tokePayload;

        try {
            let receiver = await receiverInfo.findById({ id: receiverId });
            receiverInfo.isDelete = true;

            await receiver.save();
            return res.status(200).json({ result: true });
        } catch (err) {
            next(err);
        }
    },
    updateReceiver: async (req, res, next) => {
        let { userId } = req.tokePayload;
        // numberAccount: String,
        // nameAccount: String,
        // idBank: Schema.Types.ObjectId,
        // createAt: { type: Date, default: Date.now },
        // userId: Schema.Types.ObjectId,
        // isDelete: { type: Boolean, default: false },


        let { numberAccount, nameAccount, idBank } = req.body;



    }



}












