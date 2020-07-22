const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const user = mongoose.model("user");
const userRefresh = mongoose.model("userRefresh");
const transaction = mongoose.model("transaction");
var createError = require("http-errors");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const config = require("./../config/key");
const passport = require("passport");
const ObjectId = mongoose.Types.ObjectId;
var randToken = require("rand-token");
const mailer = require("../utils/Mailer");
const otp = require("../utils/otp");

module.exports = {
  registerAccount: async (req, res, next) => {


    let { fullName, email, phone } = req.body;

    let regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

    if (!regex.test(email)) {
      next({ error: { message: "incorrect Email or password little than 3 characters", code: 422 } });

      return;
    }

    if (
      typeof fullName === undefined ||
      typeof email === undefined ||
      typeof phone === undefined
    ) {

      next({ error: { message: "Invalid value", code: 422 } });

    }

    let userFind = null;
    let accountNumber = generateAccountNumber();
    console.log(accountNumber);

    let name = generateUserName();
    let userName = "CUS" + name;

    let password = generatePassword();

    let hashPass = bcrypt.hashSync(password, 10);

    userFind = await bankAccount.findOne({ email: email });

    console.log(userFind);
    if (userFind) {
      next({ error: { message: "Email already exist", code: 422 } });

    }
    let saveLoginUser = new user({
      email: email,
      username: userName,
      hashPassword: hashPass,
      fullName: fullName,
    });
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

    let objUser = { newUser, saveLoginUser };

    return res.status(200).json({ result: objUser });
  },
  ApplyMoney: async (req, res, next) => {
    let { accountNumber, amountMoney } = req.body;
    if (typeof amountMoney === undefined || accountNumber === undefined) {

      next({ error: { message: "Invalid value", code: 602 } });
    }

    try {
      let userAccount = await user.findOne({ username: accountNumber });

      if (userAccount) {
        let applyUser = await bankAccount.findOne({ userId: userAccount._id });
        if (applyUser === null) {
          next({ error: { message: "username  not exit", code: 602 } });

        }
        applyUser.currentBalance = +applyUser.currentBalance + +amountMoney;

        await applyUser.save();

        res.status(200).json({ result: applyUser });
      } else {
        let applyUser = await bankAccount.findOne({
          accountNumber: accountNumber,
        });

        if (applyUser === null) {
          next({ error: { message: " account number or username not exit", code: 602 } });

        }
        applyUser.currentBalance = +applyUser.currentBalance + +amountMoney;

        await applyUser.save();

        res.status(200).json({ result: applyUser });
      }
    } catch (err) {
      next(err);
    }
  },
  getCustomer: async (req, res, next) => {

    let conditionQuery = {
      $and: [{},],
    };
    try {
      let e = await bankAccount.aggregate([{ $match: conditionQuery },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        }
      },
      {
        $unwind: "$user",
      },

      ]);
      res.status(200).json({ result: e });

    } catch (err) {
      nex(err);
    }
  },
  getCustomerUserId: async (req, res, next) => {
    let { userInfo } = req.query;

    let conditionQuery = null;
    let bankAccountInfo = null;
    let userInformation = null;
    if (userInfo === undefined) {
      next({ error: { message: "Invalid value", code: 602 } });

    }
    try {
      conditionQuery = await bankAccount.findOne({ accountNumber: userInfo });
      if (conditionQuery) {
        bankAccountInfo = await bankAccount.findOne({
          accountNumber: userInfo,
        });
      } else {
        userInformation = await user.findOne({
          username: userInfo,
        });
        bankAccountInfo = await bankAccount.findOne({
          userId: userInformation._id,
        });
      }
      if (!bankAccountInfo) {

        next({ error: { message: "Invalid value", code: 602 } });
      }
      res.status(200).json({ result: bankAccountInfo });
    } catch (err) {
      nex(err);
    }
  },
  historyTransactionSender: async (req, res, next) => {
    let {
      typeTransaction,
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
      if (typeof userId === undefined) {
        throw createError(602, "Invalid value");
      }

      let userSender = await bankAccount.findOne({ userId });
      console.log(userSender);
      if (userSender === null) {
        next({ error: { message: "Not found account", code: 422 } });
      }

      let conditionQuery = {
        $and: [
          {
            $or: [
              { bankAccountReceiver: userSender.accountNumber },
              { bankAccountSender: userSender.accountNumber },
            ],
          },
        ],
      };
      if (typeTransaction) {
        if (typeTransaction === "GETMONEY") {
          conditionQuery.$and.push({ typeTransaction });
        } else if (typeTransaction === "TRANSFER") {
          conditionQuery.$and.push({ typeTransaction });
        } else {
          conditionQuery.$and.push({ typeTransaction });
        }
      }

      if (startDate && endDate) {
        conditionQuery.$and.push({
          createAt: {
            $gte: new Date(startDate),
            $lt: new Date(endDate),
          },
        });
      }
      let e = await transaction.aggregate([
        { $match: conditionQuery },
        { $sort: { 'createAt': -1 } }

      ]);
      res.status(200).json({ result: e });
    } catch (err) {
      next(err);
    }
  },
};

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
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    charlen = chars.length,
    length = 8 || 32;

  for (var i = 0; i < length; i++) {
    buf[i] = chars.charAt(Math.floor(Math.random() * charlen));
  }

  return buf.join("");
};
