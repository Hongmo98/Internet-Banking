
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const user = mongoose.model("user");
const userRefresh = mongoose.model("userRefresh");
var createError = require('http-errors')
var bcrypt = require("bcrypt");
var jwt = require('jsonwebtoken');
const config = require('./../config/key');
const passport = require('passport');
const ObjectId = mongoose.Types.ObjectId;
var randToken = require('rand-token');
const mailer = require("../utils/Mailer");
const otp = require("../utils/otp");

module.exports = {




    registerAccount: async (req, res, next) => {

        // {
        //         "fullName": "vu han linh",
        //             "email": "hanlinh010198@gmail.com",
        //                 "phone": "0352349848",}

        let { fullName, email, phone } = req.body;
        let { role, userId } = req.tokePayload;
        let regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

        if (!regex.test(email)) {

            throw createError(422, "incorrect Email or password little than 3 characters");
            return;
        }

        if (typeof fullName === undefined ||
            typeof email === undefined || typeof phone === undefined) {

            throw createError(602, 'Invalid value');
        }
        if (role === 'EMPLOYEE') {
            let userFind = null;
            let accountNumber = generateAccountNumber();
            console.log(accountNumber);

            let userName = generateUserName();
            console.log(userName);
            let password = generatePassword();

            let hashPass = bcrypt.hashSync(password, 10);


            userFind = await bankAccount.findOne({ email: email });

            console.log(userFind);
            if (userFind) {
                throw createError(409, 'Email already exist');
            }
            let saveLoginUser = new user({
                email: email,
                username: userName,
                hashPassword: hashPass,
                fullName: fullName


            })
            await saveLoginUser.save();
            console.log(saveLoginUser);

            let newUser = new bankAccount({
                userId: saveLoginUser.id,
                accountName: fullName,
                phone: phone,
                accountNumber: accountNumber,
                email: email,
                hashPassword: password,
                currentBalance: 0,

            });


            await newUser.save();

            let objUser = { newUser, saveLoginUser }

            return res.status(200).json({ result: objUser });
        } else {
            throw createError(602, 'not authorization');
        }
    },
    ApplyMoney: async (req, res, next) => {
        let { userId, role } = req.tokePayload;

        let { accountNumber, amountMoney, userName } = req.body;
        if (
            typeof amountMoney === undefined) {

            throw createError(602, 'Invalid value');
        }
        let applyUser = null;
        try {
            let account = null;
            if (userName) {

                let userAccount = await user.findOne({ username: userName });
                account = userAccount.accountNumber;

            }
            else {
                account = accountNumber;
            }


            applyUser = await bankAccount.findOne({ accountNumber: accountNumber });
            if (applyUser === null) {
                throw createError(602, 'not found account');
            }


            applyUser.currentBalance = +applyUser.currentBalance + amountMoney;

            await applyUser.save();

            res.status(200).json({ result: true, applyUser });

        }
        catch (err) {
            next(err);
        }

    },
    getCustomer: async (req, res, next) => {



        let { username, accountNumber } = req.query;

        let conditionQuery = null;
        try {
            if (username) {

                conditionQuery = await bankAccount.findOne({ username: username });

            }
            else {

                conditionQuery = await bankAccount.findOne({ accountNumber: accountNumber });

            }
            if (!conditionQuery) {
                throw createError(602, 'Invalid value');
            }
            res.status(200).json({ result: conditionQuery })
        }
        catch (err) {
            nex(err);
        }


    },
    historyTransactionSender: async (req, res, next) => {
        let { typeTransaction,
            startDate,
            endDate,
            pageNumber,
            numberRecord,
            userId,
        } = req.query;
        startDate = startDate || "";
        pageNumber = +pageNumber || 1;
        numberRecord = +numberRecord || 10;
        try {
            if (
                typeof userId === undefined) {

                throw createError(602, 'Invalid value');
            }

            let userSender = await bankAccount.findOne({ userId });
            if (userSender === null) {
                next({ error: { message: "Not found account", code: 422 } });
            }

            let conditionQuery = {
                $and: [{

                },
                ]
            };
            if (typeTransaction) {
                if (typeTransaction === "GETMONEY") {
                    conditionQuery.$and.push({ typeTransaction });

                }
                else if (typeTransaction === "TRANSFER") {
                    conditionQuery.$and.push({ typeTransaction });

                } else {
                    conditionQuery.$and.push({ typeTransaction });

                }
            }
            if (startDate !== "") {
                conditionQuery.$and.push({
                    'createAt': {
                        $gt: new Date(startDate)
                    }
                })
                if (endDate) {
                    conditionQuery.$and.push({
                        'createAt': {
                            $lte: new Date(endDate),
                        }
                    })
                }
            }
            let e = await transaction.aggregate([
                { $match: conditionQuery },
                { $skip: +numberRecord * (+pageNumber - 1) },
                { $limit: +numberRecord },
                { $sort: { 'createAt': 1 } }
            ])
            res.status(200).json({ result: e });
        }
        catch (err) {
            next(err);
        }


    }

}


const generateAccountNumber = () => {
    let date = Date.now();
    let number = Math.random() * 1612392;
    let accountNumber = parseInt(date + number);
    return accountNumber;

};
const generateUserName = () => {
    let date = Date.now();
    let number = Math.random() * 1612496;
    let accountNumber = parseInt(date + number);
    return accountNumber;
};
generatePassword = () => {
    var buf = [],
        chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        charlen = chars.length,
        length = 8 || 32;

    for (var i = 0; i < length; i++) {
        buf[i] = chars.charAt(Math.floor(Math.random() * charlen));
    }

    return buf.join('');
}



