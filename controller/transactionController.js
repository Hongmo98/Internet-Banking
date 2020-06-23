
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const user = mongoose.model("user");
const receiverInfo = mongoose.model("receiverInfo");
const transaction = mongoose.model("transaction");
const information = mongoose.model("information");
const deptInformation = mongoose.model("deptInformation");
const linkedBank = mongoose.model("linkedBank");
const deptReminder = mongoose.model("deptReminder");
var createError = require('http-errors')
var bcrypt = require("bcrypt");
const config = require('./../config/key');
const redis = require("redis");
const moment = require('moment');

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
const e = require("express");
const { CLIENT_RENEG_LIMIT } = require("tls");

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

        // try {
        let sender = await bankAccount.findOne({ userId });
        let email = sender.email;

        if (sender == null) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }

        let { receiver, amountMoney, content, typeSend } = req.body;
        console.log(req.body);
        if (content === ' ') {
            content = `${sender.accountName} transfer you`
        }

        console.log(content);

        if (typeSend === true || typeSend === false) {

            let userReceiver = await bankAccount.findOne({ accountNumber: receiver });

            console.log(userReceiver);
            if (userReceiver === null) {
                //  throw createError(408, 'Not found account number');
                next({ error: { message: "Not found account number", code: 422 } });
                return;
            }
            let nameReceiver = userReceiver.accountName;

            let token = otp.generateOTP();
            let object = `
            You can use our Internet Banking services at our website "http://www.mpbank.com.vn" right after receiving this email.`

            let b = `This password will expire in 5 minutes..`

            let c = ` Do not reply to this automatically-generated email. If you have any questions, please contact MPBank Contact Center via number 0334994998 or our branches`

            let d = ` Thank you for using our services.`
            let a = '<p>You are making a bank transfer in MPBank Internet Banking. </b> <ul><li> Your transaction code is <h1>' + token + '</h1></li> <li>' + object + '</li> <li>' + b + '</li>  <li>' + c + '</li><li>' + d + '</li>  </ul>'

            client.setex(userId, 100, token, function (err) {

                console.error(err);
            });



            mailer.sentMailer("mpbank.dack@gmail.com", { email }, "MPBank Transfer", a)
                .then(async (json) => {
                    console.log(token);
                    console.log(json);

                    let data = { sender, nameReceiver, message: "send otp email ", content, amountMoney, typeSend, receiver }
                    res.status(200).json({ result: data });
                })

        } else {
            next({ error: { message: "type  cannot  suit", code: 422 } });
            return;
        }

        // } catch (err) {
        //     next(err);
        // }


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

        let { code, receiver, amountMoney, content, typeSend, typeTransaction, idRemind } = req.body;


        let userSender = await bankAccount.findOne({ userId });

        if (userSender == null) {
            next({ error: { message: "invalid correct", code: 422 } });
        }


        try {

            client.get(userId, async (err, value) => {
                if (err) {
                    console.log(err);
                    next({ error: { message: "time otp expire", code: 422 } });
                    return;
                } {
                    console.log('1', value)
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

                            await userSender.save();


                            let newTransaction = new transaction({
                                bankAccountSender: userSender.accountNumber,
                                bankAccountReceiver: receiver,
                                amount: amountMoney,
                                content: content,
                                typeSend: typeSend,
                                typeTransaction: typeTransaction,
                                fee: 2200,
                                status: "SUCCESS",
                            })
                            if (typeTransaction === 'INDEPT') {
                                let deptTra = await deptInformation.findById({ _id: ObjectId(idRemind) })

                                deptTra.status = "PAYED"
                                await deptTra.save();
                                console.log('save', deptTra)
                            }
                            await newTransaction.save();
                            let re = await receiverInfo.findOne({ numberAccount: receiver });
                            let type = false;
                            if (re === null) {
                                type = true;
                            }

                            let pro = {
                                userReceiver, userSender, newTransaction, msg: "transfer success", type
                            };
                            res.status(200).json({ result: pro });

                        } else {
                            next({ error: { message: "current balance isn't to transfer money", code: 422 } });
                        }

                    } else {
                        next({ error: { message: "otp exit ", code: 422 } });
                    }
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
        console.log(req.body)
        nameRemind = nameRemind || '';
        let number = await receiverInfo.findOne({ accountNumber });
        if (number) {
            next({ error: { message: "account number exit ", code: 422 } });
        }
        let bank = await linkedBank.findById({ _id: idBank });
        if (!bank) {
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
            nameBank: bank.nameBank,
            nameRemind: nameRemind

        })
        try {

            await saveInfo.save();
            let object = { msg: 'save information receiver in success', saveInfo }
            res.status(200).json({ result: object });
        } catch (err) {
            next(err);
        }

    },
    receiverTransfer: async (req, res, next) => {

        let { userId } = req.tokePayload;
        let { type, idBank } = req.query;
        let conditionQuery = {
            $and: [{
                userId: ObjectId(userId)
            },
            { isDelete: { $nin: [true] } },

            ]
        };
        if (type === 'mpbank') {

            let receiver = await receiverInfo.find({ userId: ObjectId(userId), isDelete: false, idBank: ObjectId(idBank) });
            res.status(200).json({ result: receiver });
        }
        else {
            let conditionQuery = {
                $and: [{
                    userId: ObjectId(userId)
                },
                { isDelete: { $nin: [true] } },
                { idBank: { $nin: [ObjectId(idBank)] } }
                ]
            };


            let e = await receiverInfo.aggregate([
                { $match: conditionQuery },

            ])
            res.status(200).json({ result: e });
        }


        // else {
        //     let receiver = await receiverInfo.find({ userId: ObjectId(userId), isDelete: false });
        //     let receiver1 = await receiverInfo.find({ userId: ObjectId(userId), isDelete: false, idBank: ObjectId(idBank) });

        //     const result = receiver.filter(item => receiver1.indexOf(ele => ele._id === item.id) === -1)
        //     // let a = receiver.filter((e) => e.idBank === idBank)
        //     // console.log(a);
        //     console.log(result)


        // res.status(200).json({ result: result });





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
            let receiver = await receiverInfo.findOneAndUpdate({ _id: ObjectId(id), userId: ObjectId(userId) }, objectUpdate, { new: true });

            if (!e) {
                return next({ error: { message: 'receiver not exists!' } });
            }
            res.status(200).json({ result: receiver });
        } catch (error) {
            next({ error: { message: 'Err', code: 601 } });
        }





    },

    requestDept: async (req, res, next) => {
        let { userId, role } = req.tokePayload;

        // {
        //     "numberAccount" :"1592105265271",  
        //     "amountMoney":"20000",
        //      "content":"m con no tao nhe"
        // }  
        let { numberAccount, amountMoney, content } = req.body;
        try {
            let sender = await bankAccount.findOne({ userId });

            if (sender == null) {
                next({ error: { message: "account not found ", code: 422 } });
                return;
            }
            console.log("1", sender);
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

            let deptInfo = new deptInformation({
                bankAccountSender: sender.accountNumber,
                bankAccountReceiver: numberAccount,
                amount: amountMoney,
                content: content

            })
            await deptUser.save();
            await deptInfo.save();
            let result = { mg: "create dept success", deptUser, deptInfo };
            res.status(200).json({ result });

        } catch (err) {
            next(err);
        }
    },

    getListNotification: async (req, res, next) => {
        let { userId, role } = req.tokePayload;
        try {

            let sender = await bankAccount.findOne({ userId });

            if (sender == null) {
                next({ error: { message: "Invalid data", code: 422 } });
                return;
            }
            console.log('2', sender.accountNumber);
            let notification = await deptReminder.find({ bankAccountReceiver: sender.accountNumber, isDelete: false });

            console.log('1', notification);
            res.status(200).json({ result: notification });


        } catch (err) {
            next(err);

        }



    },
    getBadgeNumber: async (req, res, next) => {
        let { userId, role } = req.tokePayload;
        let sender = await bankAccount.findOne({ userId });

        if (sender == null) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }
        try {
            let notifications = await deptReminder.find({ bankAccountReceiver: sender.accountNumber, isRead: false, isDelete: false });
            return res.status(200).json({ result: notifications.length });
        } catch (err) {
            next(err);
        }
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
            let sender = await bankAccount.findOne({ userId });

            if (sender == null) {
                next({ error: { message: "Invalid data", code: 422 } });
                return;
            }

            let dept = await deptInformation.find({ bankAccountSender: sender.accountNumber, isDelete: false });

            if (dept == null) {
                next({ error: { message: "Invalid list dept", code: 422 } });
                return;
            }

            res.status(200).json({ result: dept });
        } catch (err) {
            next(err);
        }

    },

    // {
    //     "reminderId":"5ee998a966202628f4ab1654",
    //     "content":" t xoa nhac no nha "
    // }
    deleteReminder: async (req, res, next) => {
        if (typeof req.body.reminderId === 'undefined') {
            next({ error: { message: "Invalid data", code: 402 } });
            return;
        }

        let { reminderId, content } = req.body;
        let { userId } = req.tokePayload;

        try {
            let sender = await bankAccount.findOne({ userId });

            if (sender == null) {
                next({ error: { message: "Invalid data", code: 422 } });
                return;
            }
            let reminder = await deptInformation.findById({ _id: reminderId });
            reminder.isDelete = true;
            let deptUser = null;
            let reCe = null;
            if (reminder.bankAccountSender === sender.accountNumber) {
                reCe = reminder.bankAccountReceiver;
            } else {
                reCe = reminder.bankAccountSender;
            }

            deptUser = new deptReminder({
                bankAccountSender: sender.accountNumber,
                bankAccountReceiver: reCe,
                contentNotification: content,
            })

            await reminder.save();
            await deptUser.save();

            return res.status(200).json({ msg: "delete success", reminder, deptUser });
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
    },
    updateReminder: async (req, res, next) => {
        let { userId } = req.tokePayload;
        let objectUpdate = { ...req.body };
        let id = req.body.id;
        delete objectUpdate["id"];
        try {
            let e = await deptInformation.findOneAndUpdate({ _id: ObjectId(id), userId: ObjectId(userId) }, objectUpdate);

            if (!e) {
                return next({ error: { message: 'receiver not exists!' } });
            }
            res.status(200).json({ result: e });
        } catch (error) {
            next({ error: { message: 'Err', code: 601 } });
        }





    },


}












