const mongoose = require('mongoose');;
const {Schema} = mongoose;

const historyBalancSchema = new Schema({
    idBankAccount : Schema.Types.ObjectId,
    balance : Number,
    createAt: { type: Date, default: Date() }
})

mongoose.model('historyBalance',historyBalancSchema);