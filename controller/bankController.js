var bcrypt = require("bcrypt");
var openpgp = require('openpgp');
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const transaction = mongoose.model("transaction");
const partner = require('./../config/partner');
const ObjectId = mongoose.Types.ObjectId;

module.exports = {

    queryAccountInformation: async (req, res, next) => {
        //  hash= account +secret_key  + ts

        let { account } = req.query;
        let timeStamp = Date.now()
        console.log("time:", timeStamp);

        let sig = account + partner.Security_key + req.headers['headerts'];
        if (req.headers['partnercode'] === partner.Partner_Code) {

            let time = +req.headers['headerts'].toString() + 60000;
            if (+time > +timeStamp) {

                if (bcrypt.compareSync(sig, req.headers['headersig'])) {
                    try {
                        if (!account) {
                            return next({ error: { message: 'account is not exists', code: 422 } });
                        }

                        let accountNumber = await bankAccount.find({ accountNumber: account });
                        if (accountNumber == null) {
                            next({ error: { message: "Invalid data", code: 422 } });
                            return;
                        }
                        //hash khi tra ve 

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


    },

    transactionAccount: async (req, res, next) => {
        let {
            accountReceiver,
            money,

        } = req.body;
        let userReceiver = null;
        if (!accountReceiver) {
            return next({ error: { message: 'account is not exists', code: 422 } });
        }

        try {
            userReceiver = await bankAccount.findOne({ accountNumber: accountReceiver });
            if (userReceiver == null) {
                next({ error: { message: "Invalid data", code: 422 } });
                return;
            }

            userReceiver.currentBalance = +userReceiver.currentBalance + +money;
            await userReceiver.save();
            res.status(200).json({ result: userReceiver });


        } catch (error) {
            next(error);

        }


    },

    testPgp: async (req, res, next) => {

        const privateKeyArmored = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: OpenPGP.js v4.10.4
Comment: https://openpgpjs.org

xYYEXsNV0xYJKwYBBAHaRw8BAQdA7LA4kqpEv+5hkH1Q3ewjHYMJNQRLKWWb
vvWUkIQuh3b+CQMIB6vnI49UfdHgUyox1KJSDjwbSmXXiiXlKOLKgPUhafRV
x6yqjp4pOrkLMF6wGCn5BrLzOyKUI8of4yy+B5PRK+Ulfb/DojTzeD3sNyh3
Yc0fTVBCYW5rIDxob25nbW8yNDExOThAZ21haWwuY29tPsJ4BBAWCgAgBQJe
w1XTBgsJBwgDAgQVCAoCBBYCAQACGQECGwMCHgEACgkQrsP2+0GwTATExQD9
Hv5exNhzeoGJQeYiKn97Xh8uOHoUVrYOBC6KWqk3ahIBAO11EtAM2vR8AW8p
j8iv0DCP35SDDlhj0B3dEwtbrXECx4sEXsNV0xIKKwYBBAGXVQEFAQEHQD+R
D2NClzWFUzj0acl9GWL7IReHH5YkPEUPduEkr8YoAwEIB/4JAwjqUP7JgODk
O+AA4FxM61djyKPfruHfIeI3i1AN9u0XLh6L1e73HaW3aZIOqaX0aVvxBg3x
vQLV2yDcs7oKp4OZn4V5VcB+REVYSSteXV7ewmEEGBYIAAkFAl7DVdMCGwwA
CgkQrsP2+0GwTASNcQEAlCqApG/iNUFsLpMURqwqYtnO6JeyBmKJS//J0uNW
WP8A/0yACDTK5PjAsXnnGIt1t9moZpjGUp8FTFHv3JpxXd4G
=1zQz
-----END PGP PRIVATE KEY BLOCK-----`
        const publicKeyArmored = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v4.10.4
Comment: https://openpgpjs.org

xjMEXsNV0xYJKwYBBAHaRw8BAQdA7LA4kqpEv+5hkH1Q3ewjHYMJNQRLKWWb
vvWUkIQuh3bNH01QQmFuayA8aG9uZ21vMjQxMTk4QGdtYWlsLmNvbT7CeAQQ
FgoAIAUCXsNV0wYLCQcIAwIEFQgKAgQWAgEAAhkBAhsDAh4BAAoJEK7D9vtB
sEwExMUA/R7+XsTYc3qBiUHmIip/e14fLjh6FFa2DgQuilqpN2oSAQDtdRLQ
DNr0fAFvKY/Ir9Awj9+Ugw5YY9Ad3RMLW61xAs44BF7DVdMSCisGAQQBl1UB
BQEBB0A/kQ9jQpc1hVM49GnJfRli+yEXhx+WJDxFD3bhJK/GKAMBCAfCYQQY
FggACQUCXsNV0wIbDAAKCRCuw/b7QbBMBI1xAQCUKoCkb+I1QWwukxRGrCpi
2c7ol7IGYolL/8nS41ZY/wD/TIAINMrk+MCxeecYi3W32ahmmMZSnwVMUe/c
mnFd3gY=
=6NYp
-----END PGP PUBLIC KEY BLOCK-----`;
        const revocationCertificate = ` -----BEGIN PGP PUBLIC KEY BLOCK-----
Version: OpenPGP.js v4.10.4
Comment: https://openpgpjs.org
Comment: This is a revocation certificate

wmEEIBYKAAkFAl7DVdMCHQAACgkQrsP2+0GwTAQTfwEA/r+lyNn6zEjlGfN/
7vGIvPBnVsHvFKkamOQNCXnsZQcBAM+G4s3GYhHeTbdzBxTCb3m4XHXbpiQj
LCo24wxpqZEB
=NTmt
-----END PGP PUBLIC KEY BLOCK-----`
        const passphrase = `nguyen thi hong mo`;
        // const passphrase = `hongmo`;
        await openpgp.initWorker({ path: 'openpgp.worker.js' })
        const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
        await privateKey.decrypt(passphrase);
        const options = {
            message: openpgp.message.fromText('hello phi'),
            publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys,
            privateKeys: [privateKey]

        }
        console.log(options);

        const { data: encrypted } = await openpgp.encrypt(options);

        const { data: decrypted } = await openpgp.decrypt({
            message: await openpgp.message.readArmored(encrypted),              // parse armored message
            publicKeys: (await openpgp.key.readArmored(publicKeyArmored)).keys, // for verification (optional)
            privateKeys: [privateKey]                                           // for decryption
        });
        res.status(200).json({ result: decrypted });


    },


}



