
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

    login: async (req, res, next) => {

        let { username, password } = req.body;
        console.log()

        if (typeof username === undefined || typeof password === undefined) {
            next({ error: { message: "Invalid value", code: 602 } });

        }
        let userFind = null;
        const FRS = 80;

        try {
            userFind = await user.findOne({ username: username });
            console.log(userFind);
            if (!userFind) {
                next({ error: { message: "username already exist", code: 602 } });

            }
            const userId = userFind.id;
            const role = userFind.role;
            if (bcrypt.compareSync(password, userFind.hashPassword)) {

                let refreshToken = randToken.generate(FRS)

                let reUser = await userRefresh.findOne({ userId: userId })

                if (reUser) {
                    await userRefresh.deleteOne({ userId: userId })
                }
                let refresh = new userRefresh({
                    refreshToken: refreshToken,
                    userId: userId
                })
                await refresh.save();
                let name = userFind.fullName;

                const accessToken = generateAccessToken(userId, role)
                res.status(200).json({
                    accessToken,
                    refreshToken,
                    userFind,

                });

            }
            else {
                next({ error: { message: "password not correct", code: 602 } });

            }

        }
        catch (err) {
            next(err);
        }


    },


    registerAccount: async (req, res, next) => {



        let { fullName, email, phone } = req.body;

        let regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

        if (!regex.test(email)) {

            next({ error: { message: "incorrect Email or password little than 3 characters", code: 422 } });
            return;
        }

        if (typeof fullName === undefined ||
            typeof email === undefined || typeof phone === undefined) {
            next({ error: { message: "Invalid value", code: 422 } });

        }
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
            next({ error: { message: "Email already exist", code: 422 } });


        }
        let saveLoginUser = new user({
            email: email,
            username: userName,
            hashPassword: hashPass,

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
    },
    logout: async (req, res) => {

        req.logout();
        res.status(200).json({ result: true });

    },

    refreshToken: async (req, res, next) => {

        let { accessToken, refreshToken } = req.body;

        jwt.verify(accessToken, config.SECRET_KEY, { ignoreExpiration: true },
            async function (err, payload) {
                if (err)
                    next({ error: { message: err, code: 422 } });


                const { userId, role } = payload
                try {
                    let ret = await userRefresh.findOne({ userId: userId, refreshToken: refreshToken });

                    if (ret === false) {
                        next({ error: { message: 'invalid refresh Token', code: 400 } });


                    }
                    const Token = generateAccessToken(userId, role)

                    res.status(200).json({ accessToken: Token });

                } catch (err) {
                    next(err);
                }

            })


    },
    getUserCurrent: async (req, res, next) => {
        let id = req.tokePayload.userId;

        console.log(id);
        try {
            let u = await user.findById({ _id: id });

            res.status(200).json({ result: u });
        } catch (err) {
            next(err);
        }
    },
    getInfo: async (req, res, next) => {
        let { userId, role } = req.tokePayload;

        if (
            typeof req.query.accountNumber === "undefined"


        ) {
            next({ error: { message: "Invalid data", code: 402 } });
            return;

        }
        console.log(req.query);
        let userCurrent = null;
        try {

            userCurrent = await bankAccount.find({ userId: ObjectId(userId) });
            if (userCurrent === null) {
                next({ error: { message: "not found user", code: 402 } });
                return;
            }
            res.status(200).json({ result: userCurrent });
        } catch (err) {
            next(err);
        }

    },
    updatePassword: async (req, res, next) => {
        if (
            typeof req.body.oldPassword === "undefined" ||
            typeof req.body.newPassword === "undefined"
        ) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }
        let id = req.tokePayload.userId;
        let { oldPassword, newPassword } = req.body;
        let currentUser = null;
        try {
            currentUser = await user.findById(id);
        } catch (err) {
            next(err);
            return;
        }

        if (currentUser == null) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }

        if (!bcrypt.compareSync(oldPassword, currentUser.hashPassword)) {
            next({ error: { message: "Current password is wrong", code: 423 } });
            return;
        }
        currentUser.hashPassword = bcrypt.hashSync(newPassword, 10);
        try {
            await currentUser.save();
            res.status(200).json({ result: true });
        } catch (err) {
            next(err);
        }



    },
    requestForgotPassword: async (req, res, next) => {
        if (typeof req.body.email === "undefined") {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }
        // {
        //     "email":"hanlinh010198@gmail.com",
        //     "username":"1591614021893"
        // }
        let { email, username } = req.body;
        let currentUser = null;
        console.log(email);

        try {
            currentUser = await user.findOne({ email: email, username: username });
            console.log(currentUser);
        } catch (err) {
            next(err);
            return;
        }

        if (currentUser == null) {
            next({ error: { message: "Invalid data", code: 422 } });
        }

        let token = otp.generateOTP();
        let object = `
        You can use our Internet Banking services at our website "http://www.mpbank.com.vn" right after receiving this email.`

        let b = `This password will expire in 24 hours. For your rights and safety, we suggest you to change your password immediately.`

        let c = ` Do not reply to this automatically-generated email. If you have any questions, please contact MPBank Contact Center via number 0334994998 or our branches`

        let d = ` Thank you for using our services.`
        let a = '<p>We would like to inform you that your Internet Banking password has been reset at your request. </b> <ul><li>Your OTP is <h1>' + token + '</h1></li> <li>' + object + '</li> <li>' + b + '</li>  <li>' + c + '</li><li>' + d + '</li>  </ul>'

        mailer.sentMailer("mpbank.dack@gmail.com", { email }, "MPBank ForgotPassword", a)
            .then(async (json) => {

                currentUser.TOKEN = token;
                console.log(json);
                try {
                    await currentUser.save();
                    console.log(currentUser)
                } catch (err) {
                    next(err);
                    return;
                }

                res.status(200).json({ result: true });
            })
            .catch((err) => {
                next(err);
                return;
            });
    },
    forgotPassword: async (req, res, next) => {
        if (
            typeof req.body.email === "undefined" ||
            typeof req.body.otp === "undefined" ||
            typeof req.body.newPassword === "undefined" ||
            typeof req.body.username === "undefined"
        ) {
            next({ error: { message: "Invalid data", code: 402 } });
            return;
        }

        let { email, otp, newPassword, username } = req.body;
        let currentUser = null;

        try {
            currentUser = await user.findOne({ email: email, username: username });
        } catch (err) {
            next(err);
            return;
        }

        if (currentUser == null) {
            next({ error: { message: "Invalid data", code: 422 } });
            return;
        }

        if (currentUser.TOKEN != otp) {
            next({ error: { message: "OTP fail", code: 422 } });
            return;
        }

        currentUser.hashPassword = bcrypt.hashSync(newPassword, 10);
        currentUser.TOKEN = "";


        try {
            await currentUser.save();
            res.status(200).json({ result: true });
        } catch (err) {
            next(err);
        }
    },
    getAccountNumber: async (req, res, next) => {

        let { userId, role } = req.tokePayload;

        let { typeAccount } = req.query;

        let userAccount = null;
        try {
            if (typeAccount) {
                userAccount = await bankAccount.find({ userId: ObjectId(userId), typeAccount: typeAccount })

                res.status(200).json({ result: userAccount })
            } else {
                userAccount = await bankAccount.find({ userId: ObjectId(userId) })

                res.status(200).json({ result: userAccount })
            }


        } catch (err) {
            next(err);
        }

    }
}

const generateAccessToken = (userId, role) => {

    const payload = {
        userId,
        role
    }
    const accessToken = jwt.sign(payload, config.SECRET_KEY, {
        expiresIn: '10m'
    })
    return accessToken;
};


