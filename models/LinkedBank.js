const mongoose = require('mongoose');
const { Schema } = mongoose;

const linkedBankSchema = ({
    nameBank: String,
    codeBank: String,
    secretKey: String,
    public: String,
    partnerCode: String,
    partnerMe: String,
    isDelete: { type: Boolean, default: false },
})

mongoose.model('linkedBank', linkedBankSchema);
