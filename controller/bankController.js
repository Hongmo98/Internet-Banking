var bcrypt = require("bcrypt");
var openpgp = require('openpgp');
const mongoose = require("mongoose");
const bankAccount = mongoose.model("bankAccount");
const transaction = mongoose.model("transaction");
const partner = require('./../config/partner');
const ObjectId = mongoose.Types.ObjectId;
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

const passphrase1 = `nguyen thi hong mo`;
const passphrase = `hongmo`;
const pub = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: Keybase OpenPGP v1.0.0
Comment: https://keybase.io/crypto

xm8EXsZNUxMFK4EEACIDAwSjWbuy49/VNWgBIxWFXy2n/d1uB3f4AaO2AY17roUV
2nEweZrhAxrMZcTcMZViE8nAQbaSsOdtwAJh3JsmsVvsPTOnl1DL1lFY0tqXM3LB
9nAE5dBhZVoOhmCSBxeCvETNImhhaGEgKG0pIDxoYW5saW5oMDEwMTk4QGdtYWls
LmNvbT7CjwQTEwoAFwUCXsZNUwIbLwMLCQcDFQoIAh4BAheAAAoJEFu3zLuz2Tcx
nxsBgJoyEx52OYzesTz568LRak066OUG6K2Nv6DdoFot3gSg50QE2voLpRW4e4t0
FWlDkAF/XRjGPgAroZl2jihiTdTx451sMugsoR4V6YMH6n0eJHsdG8nTV7r7SzNK
67EO5Kp2zlIEXsZNUxMIKoZIzj0DAQcCAwQgIOlsSCZpc/EBDN24IkoEANgx7kIj
/ADJx0KpGWlYLSioGQ1hfteUbFA1CkCGM8ojielJsRYfqnvjVG8HtdXVwsAnBBgT
CgAPBQJexk1TBQkPCZwAAhsuAGoJEFu3zLuz2TcxXyAEGRMKAAYFAl7GTVMACgkQ
19eEGWUeib8A3QEA15ufZOVMJgwsvrw3jo2Yf4Ti+UV1v5VFHmzUILkiVlgBAKaT
IczcgIDYntlQ82DC9kLHnzDjdKOjPZaHwFs7MgeuoJgBgKCB7VutmMMaJk4KrEuD
NsNR4dC2Hzu+H+mZz8R77mBc79Fl01of+kQ8AUirpuv5jgGAk7qZpeQPDKJS9/c5
Rs2z6uqQ5FCVKhTYVq1EQcvc4A4qR0hrcjXC3WnV3py3KTwNzlIEXsZNUxMIKoZI
zj0DAQcCAwTXwCCnTMcN9TT4IAMnQACotq1SupxpnYwfUZWKuxOmVLUqMkPs/gip
CFO9wXDT+Y7txAN+ZgzJWcAaTwRABsKVwsAnBBgTCgAPBQJexk1TBQkPCZwAAhsu
AGoJEFu3zLuz2TcxXyAEGRMKAAYFAl7GTVMACgkQcPwN3Nui7uo7tQD7BMG/71W+
5H9t9igOOIE3XUxINwenfPQs30FEm3GZJI4A/jLHz4CXs/9C4R312xNuRcW9SKCR
m3kvvTOrKZNgU4GxV8sBgNnWTltDD5v2bYWO7kYBhtI4ldAqxI+QfifJedt5rSOF
PQoExaOGIGvIU46c1ACQMwF/cRypDy71PdyZB4JrqIPmKdqLQYiTe5Bn5fl0xznd
j2d9FIusaZRU6Tf/21El+533
=81be
-----END PGP PUBLIC KEY BLOCK-----
`;
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
`;


module.exports = {

    queryAccountInformation: async (req, res, next) => {
        //  hash= account +secret_key  + ts

        let { account } = req.query;
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


        if (req.headers['partnercode'] === partner.Partner_CodeN || req.headers['partnercode'] === partner.Partner_CodeQ) {

            let time = +req.headers['headerts'].toString() + 60000;

            if (+time > +timeStamp) {

                if (bcrypt.compareSync(sig, req.headers['headersig'])) {
                    try {
                        if (req.headers['partnercode'] === partner.Partner_CodeQ) {
                            public = pub;
                        } else {
                            public = publicKeyArmored;
                        }

                        const { keys: [privateKey] } = await openpgp.key.readArmored(privateKeyArmored);
                        await privateKey.decrypt(passphrase1);


                        const verified = await openpgp.verify({
                            message: openpgp.cleartext.fromText('Nap tien '),
                            signature: await openpgp.signature.readArmored(signature),
                            publicKeys: (await openpgp.key.readArmored(public)).keys
                        });

                        const { valid } = verified.signatures[0];
                        if (valid) {

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

                            const { signature: detachedSignature } = await openpgp.sign({
                                message: openpgp.cleartext.fromText('Hello, World!'),
                                privateKeys: [privateKey],
                                detached: true
                            });
                            let userName = userReceiver.accountName;
                            let obj = { userName, detachedSignature }
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

        // let pri = partner.privateKeyArmored;
        // console.log(partner.privateKeyArmored);
        await openpgp.initWorker({ path: 'openpgp.worker.js' })

        const { keys: [privateKey] } = await openpgp.key.readArmored(pri);
        await privateKey.decrypt(passphrase);

        const { signature: detachedSignature } = await openpgp.sign({
            message: openpgp.cleartext.fromText('Nap tien'),
            privateKeys: [privateKey],
            detached: true
        });

        console.log(detachedSignature);
        res.status(200).json({ result: detachedSignature });


    },


}



