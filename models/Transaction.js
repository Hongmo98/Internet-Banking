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
    idBank: Schema.Types.ObjectId,
    CodeOTP: String,
    timeOTP: { type: Date, default: Date.now },
    typeTransaction: String,
    fee: Number,
    nameBank: String,
    createAt: { type: Date },
    totalTransaction: Number,
})

mongoose.model('transaction', transactionSchema);
