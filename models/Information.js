const mongoose = require('mongoose');
const { Schema } = mongoose;

const informationSchema = new Schema({
    secrekey: String,
    code: String,
    codePGP: String,
    codeRSA: String,
    name: String,
    password: String,
    linkRSA: String,
    linkPGP: String,
})

mongoose.model('information', informationSchema);
