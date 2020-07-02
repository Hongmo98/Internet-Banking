const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const user = mongoose.model("user");
const receiverInfo = mongoose.model("receiverInfo");
const transaction = mongoose.model("transaction");
const information = mongoose.model("information");
const deptInformation = mongoose.model("deptInformation");
const linkedBank = mongoose.model("linkedBank");
const deptReminder = mongoose.model("deptReminder");
const ObjectId = mongoose.Types.ObjectId;
var createError = require("http-errors");
var bcrypt = require("bcrypt");
const config = require("./../config/key");
module.exports = {
    //   phi edited
    createEmployee: async (req, res, next) => {

        let { fullName, email, role } = req.body;
        let regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

        if (!regex.test(email)) {
            throw createError(
                422,
                "incorrect Email or password little than 3 characters"
            );
            return;
        }

        if (typeof fullName === undefined || typeof email === undefined) {
            throw createError(602, "Invalid value");
        }
        try {
            let userFind = null;
            let userName = generateUserName();
            let password = generatePassword();
            let hashPass = bcrypt.hashSync(password, 10);
            userFind = await user.findOne({ email: email });
            if (userFind) {
                throw createError(409, "Email already exist");
            }
            let saveLoginUser = new user({
                email: email,
                username: userName,
                hashPassword: hashPass,
                fullName: fullName,
                role: role,
            });
            await saveLoginUser.save();
            let data = { saveLoginUser, password };
            res.status(200).json({ data });
        } catch (err) {
            next(err);
        }
    },

    //   phi edited
    getAllEmployee: async (req, res, next) => {
        try {
            let employees = await user.find({
                isDelete: false,
                role: "EMPLOYEE",
            });
            res.status(200).json({ result: employees });
        } catch (err) {
            next(err);
        }
    },

    //   phi edited
    getEmployee: async (req, res, next) => {
        let { id } = req.query;
        try {
            let employees = await user.findById({ _id: id });
            res.status(200).json({ result: employees });
        } catch (err) {
            next(err);
        }
    },

    // t chua check
    updateEmployee: async (req, res, next) => {
        let { userId } = req.tokePayload;
        let objectUpdate = { ...req.body };
        let id = req.body.id;
        delete objectUpdate["id"];
        try {
            let receiver = await user.findOneAndUpdate({
                _id: ObjectId(id),
                objectUpdate,
                new: true,
            });

            if (!e) {
                return next({ error: { message: "receiver not exists!" } });
            }
            res.status(200).json({ result: receiver });
        } catch (error) {
            next({ error: { message: "Err", code: 601 } });
        }
    },
    //   phi edited
    deleteEmployee: async (req, res, next) => {
        if (typeof req.body.employeeId === "undefined") {
            next({ error: { message: "Invalid data", code: 402 } });
            return;
        }

        let { employeeId } = req.body;
        let { userId } = req.tokePayload;

        try {
            let receiver = await user.findById({ _id: employeeId });
            receiver.isDelete = true;

            await receiver.save();
            return res.status(200).json({ result: true });
        } catch (err) {
            next(err);
        }
    },
    // t chua check
    showhistoryLinkBank: async (req, res, next) => {
        let { startDate, endDate, nameBank, pageNumber, numberRecord } = req.query;
        pageNumber = +pageNumber || 1;
        numberRecord = +numberRecord || 10;
        try {
            let conditionQuery = {
                $and: [{}],
            };
            if (startDate && endDate) {
                conditionQuery.$and.push({
                    'createAt': {
                        $gte: new Date(startDate),
                        $lt: new Date(endDate),
                    }
                })

            }

            if (nameBank) {
                conditionQuery.$and.push({ nameBank })
            }
            Promise.all([
                transaction.aggregate([
                    { $match: conditionQuery },
                    {
                        $lookup: {
                            from: "linkedbanks",
                            localField: "nameBank",
                            foreignField: "nameBank",
                            as: "linkBank",
                        },
                    },
                    {
                        $unwind: "$linkBank",
                    },


                    { $skip: +numberRecord * (+pageNumber - 1) },
                    { $limit: +numberRecord },
                    { $sort: { 'createAt': 1 } },

                ]),
                transaction.aggregate([
                    { $match: conditionQuery },
                    {
                        $lookup: {
                            from: "linkedbanks",
                            localField: "nameBank",
                            foreignField: "nameBank",
                            as: "linkBank",
                        },
                    },
                    {
                        $unwind: "$linkBank",
                    },


                    {
                        $group: {
                            _id: nameBank,
                            total: { $sum: { $multiply: ["$totalTransaction"] } },

                            count: { $sum: 1 },
                        }
                    },


                ])
            ]).then(([e, t]) => {
                res.status(200).json({ result: { transaction: e, total: t } });

            })
        } catch (err) {
            next(err);
        }
    },
};
const generateUserName = () => {
    let date = Date.now();
    let number = Math.random() * 16;
    let accountNumber = parseInt(date + number);
    return `EMP${accountNumber}`;
};
generatePassword = () => {
    var buf = [],
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
        charlen = chars.length,
        length = 8 || 32;

    for (var i = 0; i < length; i++) {
        buf[i] = chars.charAt(Math.floor(Math.random() * charlen));
    }

    return buf.join("");
};
