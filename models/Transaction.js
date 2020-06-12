const mongoose = require('mongoose');
const { Schema } = mongoose;

const transactionSchema = new Schema({
    idType: Schema.Types.ObjectId,
    bankAccountSender: String,
    bankAccountReceiver: String,
    amount: Number,
    content: String,
    status: String,
    // 2 type
    // nguoi nhan tra phi: true 
    // nguoi gui tra phi: false
    typeSend: Boolean,
    nameBank: { type: String, "index": "text", default: "MPBank" },
    CodeOTP: String,
    timeOTP: { type: Date, default: Date.now },
    typeTransaction: String,
    fee: Number,
    createAt: { type: Date, default: Date.now },
})

mongoose.model('transaction', transactionSchema);
