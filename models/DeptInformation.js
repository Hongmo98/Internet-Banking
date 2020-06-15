const mongoose = require('mongoose');
const { Schema } = mongoose;

const deptInformationSchema = new Schema({

    bankAccountSender: String,
    bankAccountReceiver: String,
    amount: Number,
    // PAY , UNPAY
    status: { type: String, "index": "text", default: "UNPAY" },
    isDelete: { type: Boolean, default: false },
})

mongoose.model('deptInformation', deptInformationSchema);
