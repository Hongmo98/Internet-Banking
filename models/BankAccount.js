const mongoose = require('mongoose');
const {Schema} = mongoose;

const bankAccountSchema = new Schema({
    accountNumber: String,
    accountName: String, // fullname cua khach hang
    openDate: {type: Date , default: Date.now },
    closeDate: Date,
    currentBalance: Number,
    idBank: Schema.Types.ObjectId,
    email: String,
    identifyCard: String,
    phone: String,
    birthday: Date,
    gender: String,
    address: String,
    avatar: { type: String, default: '/avata.png'},
    hashPassword: String,
})

mongoose.model('bankAccount', bankAccountSchema);


