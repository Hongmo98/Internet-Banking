const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const user = mongoose.model("user");
const receiverInfo = mongoose.model("receiverInfo");
const transaction = mongoose.model("transaction");
const information = mongoose.model("information");
const deptInformation = mongoose.model("deptInformation");
const linkedBank = mongoose.model("linkedBank");
const deptReminder = mongoose.model("deptReminder");
var createError = require("http-errors");
var bcrypt = require("bcrypt");
const config = require("./../config/key");
module.exports = {

  historyTransactionSender: async (req, res, next) => {
    const { userId, role } = req.tokePayload;
    let { typeTransaction,
      startDate,
      endDate,
      pageNumber,
      numberRecord,
    } = req.query;
    startDate = startDate || "";
    pageNumber = +pageNumber || 1;
    numberRecord = +numberRecord || 10;
    try {
      let userSender = await bankAccount.findOne({ userId });
      if (userSender === null) {
        next({ error: { message: "Not found account", code: 422 } });
      }
      let conditionQuery = {
        $and: [{
          $or: [{ bankAccountSender: userSender.accountNumber },
          { bankAccountReceiver: userSender.accountNumber }]

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

      if (startDate && endDate) {
        conditionQuery.$and.push({
          'createAt': {
            $gte: new Date(startDate),
            $lt: new Date(endDate),
          }
        })

      }

      let e = await transaction.aggregate([
        { $match: conditionQuery },
      
        { $sort: { 'createAt': -1 } }
      ])

      res.status(200).json({ result: e });
    }
    catch (err) {
      next(err);
    }
  }
}
