
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const user = mongoose.model("user");
const userRefresh = mongoose.model("userRefresh");
var createError = require('http-errors')
var bcrypt = require("bcrypt");
var jwt = require('jsonwebtoken');
const config = require('./../config/key');
const passport = require('passport');
var randToken = require('rand-token');
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
        //     "fullName": "nguyen thi hong mo",
        //         "email": "hongmo241198@gmail.com",
        //             "phone": "0352349848",
        //                 "password": "nguyen thi hong mo"
        // }

        let { fullName, email, phone, password } = req.body;
        let regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

        if (!regex.test(email) || password.length < 3) {

            throw createError(422, "incorrect Email or password little than 3 characters");
            return;
        } console.log("mo:", req.body);

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
        console.log("mo:", userFind);
        if (userFind) {
            throw createError(409, 'Email already exist');
        }
        let saveLoginUser = new user({
            email: email,
            hashPassword: hashPass
        })
        await saveLoginUser.save();
        console.log(saveLoginUser);
        let newUser = new bankAccount({
            accountName: fullName,
            phone: phone,
            accountNumber: accountNumber,
            email: email,
        });


        await newUser.save();
        console.log(newUser);
        let objUser = { newUser, saveLoginUser }
        console.log("test", objUser);
        // passport.authenticate("local", function (err, user, info) {
        //     if (err) {
        //         return next(err);
        //         console.log("1:", err)
        //     }
        //     if (!user) {
        //         return next({ error: { message: info.message, code: 620 } });
        //         console.log("2:", error)
        //     }

        //     req.logIn(user._id, function (err) {

        //         if (err) {
        //             return next(err);
        //         }
        //         console.log("3:", err)
        return res.status(200).json({ result: objUser });
        //     });
        // })(req, res, next);

        // } catch (err) {
        //     next(err);
        //     return;
        // }



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
}

