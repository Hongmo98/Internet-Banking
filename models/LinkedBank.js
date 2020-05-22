const mongoose = require('mongoose');
const { Schema } = mongoose;

const linkedBankSchema = ({

    nameBank: String,
    codeBank: String,
    secretKey: String,
    email: String,
})

mongoose.model('linkedBank', linkedBankSchema);
