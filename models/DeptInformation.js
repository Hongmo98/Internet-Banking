const mongoose = require('mongoose');
const { Schema } = mongoose;

const deptInformationSchema = new Schema({

    bankAccountSender: String,
    bankAccountReceiver: String,
    amount: Number,
    nameDept: String,
    content: String,
    // PAY , UNPAY
    status: { type: String, "index": "text", default: "PAY" },
    isDelete: { type: Boolean, default: false },
    iat: Number,
})

mongoose.model('deptInformation', deptInformationSchema);
