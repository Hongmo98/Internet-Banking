
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
        //     "fullName": "vu han linh",
        //         "email": "hanlinh010198@gmail.com",
        //             "phone": "0352349848",
        //                 "password": "vu han linh"

        // 
        //     "email": "hongmo241198@gmail.com",
        //         "password": "nguyen thi hong mo"
        // 
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
            console.log(accountNumber)
            let userName = generateUserName();
            console.log(userName);
            let password = generatePassword();
            console.log(password);
            let hashPass = bcrypt.hashSync(password, 10);
            console.log(hashPass);

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
            console.log(newUser);
            let objUser = { newUser, saveLoginUser }

            return res.status(200).json({ result: objUser });
        } else {
            throw createError(602, 'not authorization');
        }
    },
    ApplyMoney: async (req, res, next) => {
        let { userId, role } = req.tokePayload;
        if (role === 'EMPLOYEE') {
            let { accountNumber, amountMoney } = req.body;
            if (typeof accountNumber === undefined ||
                typeof amountMoney === undefined || typeof phone === undefined) {

                throw createError(602, 'Invalid value');
            }
            let applyUser = null;
            try {
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
        }
        else {
            throw createError(602, 'you cannot except query ');

        }


    },
    getCustomer: async (req, res, next) => {

        let { role, userId } = req.tokePayload;

        let { username, accountNumber } = req.query;
        if (role === 'EMPLOYEE') {

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
        } else {
            throw createError(602, 'you cannot accept ');
        }

    },

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



