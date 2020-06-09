const mongoose = require('mongoose');
const { Schema } = mongoose;

const bankAccountSchema = new Schema({
    accountNumber: String,
    accountName: String, // fullname cua khach hang
    openDate: { type: Date, default: Date.now },
    closeDate: Date,
    currentBalance: Number,
    idBank: Schema.Types.ObjectId,
    email: String,
    phone: String,
    avatar: { type: String, default: '/avata.png' },
    typeAccount: { type: String, "index": "text", default: "Credit" },
    hashPassword: String,
    userId: Schema.Types.ObjectId,

})

module.exports = mongoose.model('bankAccount', bankAccountSchema);


