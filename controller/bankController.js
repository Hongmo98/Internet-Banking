var bcrypt = require("bcrypt");
var openpgp = require('openpgp');
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const transaction = mongoose.model("transaction");
const saveSign = mongoose.model("savesign");
const partner = require('./../config/partner');
const ObjectId = mongoose.Types.ObjectId;
const pri = `-----BEGIN PGP PRIVATE KEY BLOCK-----
Version: Keybase OpenPGP v1.0.0
Comment: https://keybase.io/crypto

xcASBF7GTVMTBSuBBAAiAwMEo1m7suPf1TVoASMVhV8tp/3dbgd3+AGjtgGNe66F
FdpxMHma4QMazGXE3DGVYhPJwEG2krDnbcACYdybJrFb7D0zp5dQy9ZRWNLalzNy
wfZwBOXQYWVaDoZgkgcXgrxE/gkDCEUjMuYLC7MgYFY27jnphWwPfyj5eSvdtqfj
mZUH+w7JDOyEqfZMGE4/VXob4XkBOsafue8PA8IsP3vzreJMj+/pWC+NrNdhtibu
shZ6x8Qzx1DQoq8ZMkNDdXuKM19IzSJoYWhhIChtKSA8aGFubGluaDAxMDE5OEBn
bWFpbC5jb20+wo8EExMKABcFAl7GTVMCGy8DCwkHAxUKCAIeAQIXgAAKCRBbt8y7
s9k3MZ8bAYCaMhMedjmM3rE8+evC0WpNOujlBuitjb+g3aBaLd4EoOdEBNr6C6UV
uHuLdBVpQ5ABf10Yxj4AK6GZdo4oYk3U8eOdbDLoLKEeFemDB+p9HiR7HRvJ01e6
+0szSuuxDuSqdselBF7GTVMTCCqGSM49AwEHAgMEICDpbEgmaXPxAQzduCJKBADY
Me5CI/wAycdCqRlpWC0oqBkNYX7XlGxQNQpAhjPKI4npSbEWH6p741RvB7XV1f4J
AwgPnTa3JWncqmCpfHQjuxZJcQA7dYlHieX6El70HbUzPg6kvpibp5Umi378Gnk7
nIuS9Z/EYLYfyYWeK2PEt5uvBmDf5fx7JXUOk4c+QwMPwsAnBBgTCgAPBQJexk1T
BQkPCZwAAhsuAGoJEFu3zLuz2TcxXyAEGRMKAAYFAl7GTVMACgkQ19eEGWUeib8A
3QEA15ufZOVMJgwsvrw3jo2Yf4Ti+UV1v5VFHmzUILkiVlgBAKaTIczcgIDYntlQ
82DC9kLHnzDjdKOjPZaHwFs7MgeuoJgBgKCB7VutmMMaJk4KrEuDNsNR4dC2Hzu+
H+mZz8R77mBc79Fl01of+kQ8AUirpuv5jgGAk7qZpeQPDKJS9/c5Rs2z6uqQ5FCV
KhTYVq1EQcvc4A4qR0hrcjXC3WnV3py3KTwNx6UEXsZNUxMIKoZIzj0DAQcCAwTX
wCCnTMcN9TT4IAMnQACotq1SupxpnYwfUZWKuxOmVLUqMkPs/gipCFO9wXDT+Y7t
xAN+ZgzJWcAaTwRABsKV/gkDCG4reaeGoGfpYFVxATmktcpf5L77vZ1vyDT9916O
uEANjP+GXi5cDm1z/hC6SN+qZEAGsl7YGhBK3g7ESd7OQgWcWayOA1PjpFvzWIki
QqDCwCcEGBMKAA8FAl7GTVMFCQ8JnAACGy4AagkQW7fMu7PZNzFfIAQZEwoABgUC
XsZNUwAKCRBw/A3c26Lu6ju1APsEwb/vVb7kf232KA44gTddTEg3B6d89CzfQUSb
cZkkjgD+MsfPgJez/0LhHfXbE25Fxb1IoJGbeS+9M6spk2BTgbFXywGA2dZOW0MP
m/ZthY7uRgGG0jiV0CrEj5B+J8l523mtI4U9CgTFo4Yga8hTjpzUAJAzAX9xHKkP
LvU93JkHgmuog+Yp2otBiJN7kGfl+XTHOd2PZ30Ui6xplFTpN//bUSX7nfc=
=2KvU
-----END PGP PRIVATE KEY BLOCK-----
`


const passphrase = "hongmo";

module.exports = {

    queryAccountInformation: async (req, res, next) => {
        //  hash= account +secret_key  + ts

        let { account } = req.body;
        let timeStamp = Date.now()
        console.log("time:", timeStamp);

        let sig = account + partner.Security_key + req.headers['headerts'];

        let signature = bcrypt.hashSync(sig, 10);

        console.log(signature);
        if (req.headers['partnercode'] === partner.Partner_CodeN || req.headers['partnercode'] === partner.Partner_CodeQ) {

            let time = +req.headers['headerts'].toString() + 60000;
            if (+time > +timeStamp) {

                if (bcrypt.compareSync(sig, req.headers['headersig'])) {
                    try {
                        if (!account) {
                            return next({ error: { message: 'account is not exists' } });
                        }

                        let accountNumber = await bankAccount.findOne({ accountNumber: account });
                        if (accountNumber === null) {
                            next({ error: { message: "Invalid data" } });
                            return;
                        }
                        //hash khi tra ve 
                        let user = accountNumber.accountName;
                        res.status(200).json({ result: user });
                    } catch (err) {
                        next(err);
                    }
                } else {
                    next({ error: { message: 'The file has been edited' } });
                }
            } else {
                next({ error: { message: 'time expire ' } });
            }

        }
        else {
            next({ error: { message: ' link unsuccess ' } });
        }


    },

    transactionAccount: async (req, res, next) => {

        await openpgp.initWorker({ path: 'openpgp.worker.js' })

        let public;

        let timeStamp = Date.now()
        console.log("time:", timeStamp);

        let { signature, accountReceiver, money } = req.body;

        let sig = accountReceiver + partner.Security_key + req.headers['headerts'];
        let signature1 = bcrypt.hashSync(sig, 10);
        console.log(signature1);

        console.log("mo:", req.headers['headerts'].toString());
        if (req.headers['partnercode'] === partner.Partner_CodeN || req.headers['partnercode'] === partner.Partner_CodeQ) {


            let time = +req.headers['headerts'] + 60000;

            if (+time > +timeStamp) {

                if (bcrypt.compareSync(sig, req.headers['headersig'])) {
                    try {
                        if (req.headers['partnercode'] === partner.Partner_CodeQ) {
                            public = partner.pub;
                            console.log(public);
                        } else {
                            public = partner.publicbank;
                            console.log(public);
                        }

                        const { keys: [privateKey] } = await openpgp.key.readArmored(partner.privatebank);
                        await privateKey.decrypt(partner.passphrase);


                        const verified = await openpgp.verify({
                            message: openpgp.cleartext.fromText('Nap tien '),
                            signature: await openpgp.signature.readArmored(signature),
                            publicKeys: (await openpgp.key.readArmored(public)).keys
                        });

                        const { valid } = verified.signatures[0];
                        if (valid) {

                            let e = new saveSign({
                                respone: req.body,
                                sig: signature,
                                time: new Date(),

                            })

                            let a = await e.save();

                            if (!accountReceiver) {
                                return next({ error: { message: 'account is not exists' } });
                            }


                            userReceiver = await bankAccount.findOne({ accountNumber: accountReceiver });

                            if (userReceiver == null) {
                                next({ error: { message: "Invalid data" } });
                                return;
                            }

                            userReceiver.currentBalance = +userReceiver.currentBalance + +money;
                            await userReceiver.save();

                            const { signature: signatureMBP } = await openpgp.sign({
                                message: openpgp.cleartext.fromText('Hello, World!'),
                                privateKeys: [privateKey],
                                detached: true
                            });
                            let userName = userReceiver.accountName;
                            let obj = { userName, signatureMBP }
                            res.status(200).json({ result: obj });


                        } else {
                            return next({ error: { message: 'connect unsuccess' } });
                        }
                    } catch (error) {
                        next({ error: { message: "not link bank" } });

                    }
                }
                else {
                    next({ error: { message: 'The file has been edited' } });
                }

            }
            else {
                next({ error: { message: 'time expire ' } });
            }
        }
        else {
            next({ error: { message: ' link unsuccess ' } });
        }
    },




    testPgp: async (req, res, next) => {


        await openpgp.initWorker({ path: 'openpgp.worker.js' })

        const { keys: [privateKey] } = await openpgp.key.readArmored(pri);
        await privateKey.decrypt(partner.passphrase);

        const { signature: detachedSignature } = await openpgp.sign({
            message: openpgp.cleartext.fromText('Nap tien'),
            privateKeys: [privateKey],
            detached: true
        });

        console.log(detachedSignature);
        // const verified = await openpgp.verify({
        //     message: openpgp.cleartext.fromText('Nap tien '),
        //     signature: await openpgp.signature.readArmored(detachedSignature),
        //     publicKeys: (await openpgp.key.readArmored(partner.pub)).keys
        // });

        // const { valid } = verified.signatures[0];


        res.status(200).json({ result: detachedSignature });


    },


}



