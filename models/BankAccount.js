const mongoose = require('mongoose');
const { Schema } = mongoose;

const bankAccountSchema = new Schema({
    accountNumber: String,
    idUser: Schema.Types.ObjectId,
    accountName: String,
    openDate: { type: Date, default: Date.now },
    closeDate: Date,
    currentBalance: Number,
    idBank: Schema.Types.ObjectId
})

module.exports = mongoose.model('bankaccount', bankAccountSchema);


