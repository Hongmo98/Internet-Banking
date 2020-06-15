
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const user = mongoose.model("user");
const receiverInfo = mongoose.model("receiverInfo");
const transaction = mongoose.model("transaction");
const information = mongoose.model("information");
const deptInformation = mongoose.model("deptInformation");

const deptReminder = mongoose.model("deptReminder");
var createError = require('http-errors')
var bcrypt = require("bcrypt");
const config = require('./../config/key');
const redis = require("redis");
// const src = 'redis-13088.c8.us-east-1-2.ec2.cloud.redislabs.com:13088';
const client = redis.createClient('13088', 'redis-13088.c8.us-east-1-2.ec2.cloud.redislabs.com', { no_ready_check: true });
client.auth('Z9qiKNw7XcCx1AgrFJMdpC81DO8Betle', function (err) {

});

client.on('error', function (err) {
    console.log('Error ' + err);
});

client.on('connect', function () {
    console.log('Connected to Redis');
});


const ObjectId = mongoose.Types.ObjectId;

const mailer = require("../utils/Mailer");
const otp = require("../utils/otp");

module.exports = {

    test: async (req, res) => {

        //client.del('hello'); // xoa

        // No further commands will be processed

        client.get("hello", function (err, d) {
            console.log(d)
            res.send(d);
        });


    },
    test1: (req, res) => {
        client.setex("hello", 100, "world", function (err) {

            console.error(err);
        });
        res.send(true);
    },
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
            let email = sender.email;

            if (sender == null) {
                next({ error: { message: "Invalid data", code: 422 } });
                return;
            }

            let { receiver, amountMoney, content, typeSend } = req.body;
            console.log(req.body);

            if (typeSend === true || typeSend === false) {

                let userReceiver = await bankAccount.findOne({ accountNumber: receiver });
                let nameReceiver = userReceiver.accountName;
                console.log(userReceiver);
                if (userReceiver === null) {
                    next({ error: { message: "Not found account number", code: 422 } });
                    return;
                }


                let token = otp.generateOTP();
                client.setex(userId, 100, token, function (err) {

                    console.error(err);
                });
                mailer.sentMailer("mpbank.dack@gmail.com", { email }, "transfer", token)
                    .then(async (json) => {

                        console.log(json);

                        let data = { sender, nameReceiver, message: "send otp email ", content, amountMoney, typeSend, receiver }
                        res.status(200).json({ result: data });
                    })

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
        let { userId, role } = req.tokePayload;
        console.log(req.body.code);
        if (
            typeof req.body.code === 'undefined'

        ) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }

        let { code, receiver, amountMoney, content, typeSend } = req.body;

        console.log(req.body);
        let userSender = await bankAccount.findOne({ userId });

        if (userSender == null) {
            next({ error: { message: "invalid correct", code: 422 } });
        }

        console.log(code);
        try {

            client.get(userId, async function (err, value) {
                if (err) {
                    next({ error: { message: "time otp expire", code: 422 } });
                }
                console.log("mo", value);
                if (value === code) {

                    let userReceiver = await bankAccount.findOne({ accountNumber: receiver });
                    if (userReceiver == null) {
                        next({ error: { message: "invalid correct", code: 422 } });
                    }
                    let money = +amountMoney;

                    let feeTransfer = + 2200;
                    let service = money + feeTransfer + 50000;

                    if (+userSender.currentBalance > service) {
                        if (typeSend === false) {

                            userReceiver.currentBalance = +userReceiver.currentBalance + money - feeTransfer;

                            userSender.currentBalance = + userSender.currentBalance - money;
                        }
                        else {
                            userReceiver.currentBalance = +userReceiver.currentBalance + money;

                            userSender.currentBalance = + userSender.currentBalance - money - feeTransfer;
                        }

                        await userReceiver.save();
                        console.log(userReceiver);
                        await userSender.save();
                        console.log(userSender);

                        let newTransaction = new transaction({
                            bankAccountSender: userSender.accountNumber,
                            bankAccountReceiver: receiver,
                            amount: amountMoney,
                            content: content,
                            typeSend: typeSend,
                            typeTransaction: "TRANSFER",
                            fee: 2200,
                            status: "SUCCESS",
                        })
                        await newTransaction.save();


                        let pro = {
                            userReceiver, userSender, newTransaction, msg: "transfer success"
                        };
                        res.status(200).json({ result: pro });

                    } else {
                        next({ error: { message: "current balance isn't to transfer money", code: 422 } });
                    }

                } else {
                    next({ error: { message: "otp exit ", code: 422 } });
                }
            });

        } catch (err) {
            next(err);
            return;


        }
    },

    saveReceive: async (req, res, next) => {
        let { userId } = req.tokePayload;
        // {
        //     "accountNumber":"1591656428697",
        //     "accountName"  :"nguyen thi hu huong",
        //     "idBank"  :"5ee353c900cceb8a5001c7cf",
        //     "nameRemind":"huong huong"
        // }
        let { accountNumber, accountName, idBank, nameRemind } = req.body
        console.log(req.body);
        let number = await receiverInfo.findOne({ accountNumber });
        if (number) {
            next({ error: { message: "account number exit ", code: 422 } });
        }

        // if (
        //     typeof req.body.accountNumber === 'undefined' ||
        //     typeof req.body.accountName === 'undefined'

        // ) {
        //     next({ error: { message: "In valid data", code: 422 } });
        //     return;
        // }

        let saveInfo = new receiverInfo({
            numberAccount: accountNumber,
            nameAccount: accountName,
            userId: userId,
            idBank: idBank,
            nameRemind: nameRemind


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
    receiverInformation: async (req, res, next) => {
        let { userId, role } = req.tokePayload;
        let { id } = req.query;
        try {
            let receiver = await receiverInfo.findById({ _id: ObjectId(id) });
            if (!receiver) {
                next({ error: { message: "Invalid data", code: 402 } });
            }

            return res.status(200).json({ result: receiver });
        } catch (err) {
            next(err);
        }




    },
    updateReceiver: async (req, res, next) => {
        let { userId } = req.tokePayload;
        let objectUpdate = { ...req.body };
        let id = req.body.id;
        delete objectUpdate["id"];
        try {
            let e = await receiverInfo.findOneAndUpdate({ _id: ObjectId(id), userId: ObjectId(userId) }, objectUpdate);

            if (!e) {
                return next({ error: { message: 'receiver not exists!' } });
            }
            res.status(200).json({ result: e });
        } catch (error) {
            next({ error: { message: 'Err', code: 601 } });
        }





    },
    // idBankAccount : Schema.Types.ObjectId,
    // bankAccountSender: String,
    // bankAccountReceiver: String,
    // amount: Number,
    // contentNotification: String,
    // isRead: Boolean,
    // isDelete: Boolean,
    // createAt: { type: Date, default: Date() },
    // updateAt: Date

    requestDept: async (req, res, next) => {
        let { userId, role } = req.body;

        // {
        //     "numberAccount" :"1591961683264",  
        //     "amountMoney":"20000",
        //      "content":"m con no tao nhe"
        // }  
        let { numberAccount, amountMoney, content } = req.body;
        try {
            let sender = await bankAccount.findOne({ userId });

            if (sender == null) {
                next({ error: { message: "Invalid data", code: 422 } });
                return;
            }
            let number = await bankAccount.findOne({ accountNumber: numberAccount });

            if (number == null) {
                next({ error: { message: "Invalid  account", code: 422 } });
                return;
            }
            let deptUser = new deptReminder({
                bankAccountSender: sender.accountNumber,
                bankAccountReceiver: numberAccount,
                amount: amountMoney,
                contentNotification: content,

            })
            // bankAccountSender: String,
            // bankAccountReceiver: String,
            // amount: Number,
            // // PAY , UNPAY
            // status:  { type: String, "index": "text", default: "UNPAY" },
            let deptInfo = new deptReminder({
                bankAccountSender: sender.accountNumber,
                bankAccountReceiver: numberAccount,
                amount: amountMoney
            })
            await deptUser.save();
            await deptInfo.save();
            let result = { mg: "create dept success", deptUser, deptInfo };
            res.status(200).json({ result });

        } catch (err) {
            next(err);
        }
    },

    notificationDept: async (req, res, next) => {
        let { userId, role } = req.tokePayload;

        client.set(userId, '42', function (err) {
            if (err) {
                throw err; /* in production, handle errors more gracefully */
            }
            else {
                client.get(userId, function (err, value) {
                    if (err) {
                        throw err;
                    } else {
                        console.log(value);
                        res.status(200).json({ value });
                    }
                }
                );
            }
        });

    },
    showDeptRemindUnPay: async (req, res, next) => {
        let { userId, role } = req.tokePayload;
        try {
            let sender = await bankAccount.findOne({ userId });

            if (sender == null) {
                next({ error: { message: "Invalid data", code: 422 } });
                return;
            }
            let dept = await deptInformation.find({ bankAccountReceiver: sender.accountNumber, isDelete: false });
            if (dept == null) {
                next({ error: { message: "Invalid list dept", code: 422 } });
                return;
            }
            res.status(200).json({ result: dept });
        } catch (err) {
            next(err);
        }

    },
    showDeptRemind: async (req, res, next) => {
        let { userId, role } = req.tokePayload;
        try {

            let dept = await deptInformation.find({ bankAccountSender: sender.accountNumber, isDelete: false });
            if (dept == null) {
                next({ error: { message: "Invalid list dept", code: 422 } });
                return;
            }

            res.status(200).json({ result: dept, deptUser });
        } catch (err) {
            next(err);
        }

    },
    //     getListNotification: async(req, res, next) => {
    //         let { userId, role } = req.tokePayload;
    //         try {
    //             let sender = await bankAccount.findOne({ userId });

    //             if (sender == null) {
    //                 next({ error: { message: "Invalid data", code: 422 } });
    //                 return;
    //             }

    //         } catch (err) {
    //             next(err);
    //         }
    // }
    deleteReminder: async (req, res, next) => {
        if (typeof req.body.reminderId === 'undefined') {
            next({ error: { message: "Invalid data", code: 402 } });
            return;
        }

        let { reminderId } = req.body;
        let { userId } = req.tokePayload;

        try {
            let reminder = await deptInformation.findById({ id: reminderId });
            reminder.isDelete = true;

            await reminder.save();
            return res.status(200).json({ msg: "delete success" });
        } catch (err) {
            next(err);
        }
    },
    transferReminder: async (req, res, next) => {
        let { userId, role } = req.tokePayload;
        let { accountReminder, money, content } = req.body;

        try {
            let sender = await bankAccount.findOne({ userId });

            if (sender == null) {
                next({ error: { message: "Invalid data", code: 422 } });
                return;
            } let userReceiver = await bankAccount.findOne({ accountNumber: accountReminder });
            console.log(userReceiver);
            if (userReceiver === null) {
                next({ error: { message: "Not found account number", code: 422 } });
                return;
            }
            let nameReceiver = userReceiver.accountName;

            let newTransaction = new transaction({
                bankAccountSender: sender.accountNumber,
                bankAccountReceiver: accountReminder,
                amount: money,
                content: content,
                typeSend: typeSend,
                typeTransaction: "inDebt",
                fee: 2200,
                CodeOTP: "",
                status: "PROGRESS",
                timeOTP: Date.now(),
            })
            await newTransaction.save();


            let data = { newTransaction, sender, nameReceiver }
            res.status(200).json({ result: data });

        } catch (err) {

        }
    }
}












