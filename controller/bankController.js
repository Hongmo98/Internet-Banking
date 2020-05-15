var bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const partner = require('./../config/partner');
const ObjectId = mongoose.Types.ObjectId;
module.exports = {

    queryAccountInformation: async (req, res, next) => {
        //  hash= account +secret_key + partner + ts
        let { account } = req.query;
        let timeStamp = Date.now()
        console.log("time:", timeStamp);

        let sig = account + partner.Security_key + partner.Partner_Code + req.headers['headerts'];
        // let signature = bcrypt.hashSync(sig, 10);
        // console.log('sig', signature);


        if (req.headers['partnercode'] === partner.Partner_Code) {


            let time = +req.headers['headerts'].toString() + 60000;
            if (+time > +timeStamp) {

                if (bcrypt.compareSync(sig, req.headers['headersig'])) {
                    try {
                        if (!account) {
                            return next({ error: { message: 'account is not exists', code: 422 } });
                        }

                        let accountNumber = await bankAccount.find({ accountNumber: account });

                        res.status(200).json({ result: accountNumber });
                    } catch (err) {
                        next(err);
                    }
                } else {
                    next({ error: { message: 'The file has been edited', code: 402 } });
                }
            } else {
                next({ error: { message: 'time expire ', code: 402 } });
            }

        }
        else {
            next({ error: { message: ' link unsuccess ', code: 401 } });
        }


    }

}
