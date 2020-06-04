
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
// var Recaptcha = require('express-recaptcha').RecaptchaV3;
// var recaptcha = new Recaptcha('6LdRWP8UAAAAAARZkcNKlpokIu-Bl4O0dyyqcGS9', '6LdRWP8UAAAAAIKjOpocx34nq-3R6nURnsiaY5c7');
module.exports = {

    login: async (req, res, next) => {
        let { email, password } = req.body;

        let regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

        if (!regex.test(email) || password.length < 3) {

            throw createError(422, "incorrect Email or password little than 3 characters");
            return;
        }
        if (typeof email === undefined || typeof password === undefined) {

            throw createError(602, 'Invalid value');
        }
        let userFind = null;
        const FRS = 80;

        try {
            userFind = await user.findOne({ email: email });
            if (!userFind) {
                throw createError(409, 'Email already exist');
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

                const accessToken = generateAccessToken(userId, role)
                res.status(200).json({
                    accessToken,
                    refreshToken
                });

            }
            else {
                throw createError(409, 'password not correct ');

            }

        }
        catch (err) {
            next(err);
        }


    },

    registerAccount: async (req, res, next) => {

        // {
        //     "fullName": "vu han linh",
        //         "email": "hanlinh010198@gmail.com",
        //             "phone": "0352349848",
        //                 "password": "vu han linh"
        // }
        // {
        //     "email": "hongmo241198@gmail.com",
        //         "password": "nguyen thi hong mo"
        // }
        let { fullName, email, phone, password } = req.body;
        let regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

        if (!regex.test(email) || password.length < 3) {

            throw createError(422, "incorrect Email or password little than 3 characters");
            return;
        }

        if (typeof fullName === undefined || typeof password === undefined
            || typeof email === undefined || typeof phone === undefined) {

            throw createError(602, 'Invalid value');
        }
        let userFind = null;
        let date = Date.now();
        let number = Math.random() * 1612392;
        let accountNumber = parseInt(date + number);
        let hashPass = bcrypt.hashSync(fullName, 10)

        userFind = await bankAccount.findOne({ email: email });

        if (userFind) {
            throw createError(409, 'Email already exist');
        }
        let saveLoginUser = new user({
            email: email,
            hashPassword: hashPass,
            role: "customer"
        })
        await saveLoginUser.save();

        let newUser = new bankAccount({
            userId: saveLoginUser.id,
            accountName: fullName,
            phone: phone,
            accountNumber: accountNumber,
            email: email,
            currentBalance: 0,
            typeAccount: "Credit",
        });


        await newUser.save();
        console.log(newUser);
        let objUser = { newUser, saveLoginUser }

        return res.status(200).json({ result: objUser });
    },

    refreshToken: async (req, res, next) => {

        let { accessToken, refreshToken } = req.body;

        jwt.verify(accessToken, config.SECRET_KEY, { ignoreExpiration: true },
            async function (err, payload) {
                if (err)
                    throw createError(401, err);

                const { userId, role } = payload
                try {
                    let ret = await userRefresh.findOne({ userId: userId, refreshToken: refreshToken });

                    if (ret === false) {
                        throw createError(400, 'invalid refresh Token');
                    }
                    const Token = generateAccessToken(userId, role)

                    res.status(200).json({ accessToken: Token });

                } catch (err) {
                    next(err);
                }

            })


    },
    getUserCurrent: async (req, res, next) => {
        let userId = req.tokePayload.userId;
        try {
            let u = await bankAccount.findOne({ userId: ObjectId(userId) });

            res.status(200).json({ result: u });
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

        let email = req.body.email;
        let currentUser = null;
        console.log(email);

        try {
            currentUser = await user.findOne({ email: email });
            console.log(currentUser);
        } catch (err) {
            next(err);
            return;
        }

        if (currentUser == null) {
            next({ error: { message: "Invalid data", code: 422 } });
        }

        let token = otp.generateOTP();

        mailer.sentMailer("mpbank.dack@gmail.com", { email }, "confirm", token)
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
            typeof req.body.newPassword === "undefined"
        ) {
            next({ error: { message: "Invalid data", code: 402 } });
            return;
        }
        //  {
        //      "email":"hanlinh010198@gmail.com",
        //      "otp":"1234",
        //      "newPassword":"hongmo234"

        //  }
        let { email, otp, newPassword } = req.body;
        let currentUser = null;

        try {
            currentUser = await user.findOne({ email: email });
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




}

const generateAccessToken = (userId, role) => {

    const payload = {
        userId,
        role
    }
    const accessToken = jwt.sign(payload, config.SECRET_KEY, {
        // expiresIn: '10m'
    })
    return accessToken;
}

