const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankaccount");
module.exports = {

    queryAccountInformation: async (req, res, next) => {

        let { account } = req.query;
        try {
            let accountNumber = await bankAccount.find({ accountName: account })
            console.log("TCL : ", accountNumber);
            res.status(200).json({ result: accountNumber });
        } catch (err) {
            console.log(err)
            next(err);
        }

    }
}
