
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
        // {
        //     "username":"1591679264587",
        //     "password":"dBkcH2dm"
        //  }
        let { username, password } = req.body;
        console.log()
        // if (password.length < 8) {

        //     throw createError(422, "incorrect Email or password little than 3 characters");
        //     return;
        // }
        if (typeof username === undefined || typeof password === undefined) {

            throw createError(602, 'Invalid value');
        }
        let userFind = null;
        const FRS = 80;

        try {
            userFind = await user.findOne({ username: username });
            console.log(userFind);
            if (!userFind) {
                throw createError(409, 'username already exist');
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
                    name,
                    role
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
    recaptchaGoogle: async (req, res, next) => {
        if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
            return res.json({ "responseCode": 1, "responseDesc": "Please select captcha" });
        }
        var secretKey = '6LdRWP8UAAAAAIKjOpocx34nq-3R6nURnsiaY5c7';
        var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress
        request(verificationUrl, function (error, response, body) {
            body = JSON.parse(body);
            if (body.success !== undefined && !body.success) {
                return res.json({ "responseCode": 1, "responseDesc": "Failed captcha verification" });
            }
            res.json({ "responseCode": 0, "responseDesc": "Sucess" });
        });
    },


    registerAccount: async (req, res, next) => {

        // {
        //     "fullName": "vu han linh",
        //         "email": "hanlinh010198@gmail.com",
        //             "phone": "0352349848",
        //                 "password": "vu han linh"
        // 
        // 
        //     "email": "hongmo241198@gmail.com",
        //         "password": "nguyen thi hong mo"
        // 
        let { fullName, email, phone } = req.body;

        let regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

        if (!regex.test(email)) {

            throw createError(422, "incorrect Email or password little than 3 characters");
            return;
        }

        if (typeof fullName === undefined ||
            typeof email === undefined || typeof phone === undefined) {

            throw createError(602, 'Invalid value');
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
            throw createError(409, 'Email already exist');
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
    // logout: async (req, res) => {
    //     req.logout();
    //     res.status(200).json({ result: true });
    // },

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
        let id = req.tokePayload.userId;

        console.log(id);
        try {
            let u = await user.findById({ _id: id });
            console.log(u);
            res.status(200).json({ result: u });
        } catch (err) {
            next(err);
        }
    },
    getInfo: async (req, res, next) => {
        let { userId, role } = req.tokePayload;
        let { accountNumber, typeAccount } = req.query;
        if (
            typeof req.query.accountNumber === "undefined"


        ) {
            next({ error: { message: "Invalid data", code: 402 } });
            return;

        }
        console.log(req.query);
        let userCurrent = null;
        try {

            userCurrent = await bankAccount.findOne({ userId: ObjectId(userId), typeAccount: typeAccount, accountNumber: accountNumber });
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

        mailer.sentMailer("mpbank.dack@gmail.com", { email }, "đổi mật khẩu", token)
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
        //  {
        //      "email":"hanlinh010198@gmail.com",
        //      "otp":"372976",
        //      "newPassword":"hongmo234",
        //         "username":"1591614021893 "

        //  }
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
        console.log(req.query);
        if (
            typeof req.query.typeAccount === "undefined"

        ) {
            next({ error: { message: "Invalid data", code: 402 } });
            return;

        }
        let userAccount = null;
        try {
            userAccount = await bankAccount.findOne({ userId: ObjectId(userId), typeAccount: typeAccount })
            if (userAccount === null) {
                next({ error: { message: "not found user", code: 402 } });
                return;
            }

            res.status(200).json({ result: userAccount })


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
        // expiresIn: '10m'
    })
    return accessToken;
};


