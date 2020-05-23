const mongoose = require('mongoose');
const { Schema } = mongoose;

const linkedBankSchema = ({
    nameBank: String,
    codeBank: String,
    secretKey: String,
    public: String,
    partnerMe: String,
})

mongoose.model('linkedBank', linkedBankSchema);
