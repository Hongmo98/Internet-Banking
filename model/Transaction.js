const mongoose = require('mongoose');
const {Schema} = mongoose;

const transactionSchema = new Schema({
    idType: Schema.Types.ObjectId,
    bankAccountSender : String,
    bankAccountReceiver : String,
    amount: Number,
    content: String,
    status: String,
    // 2 type
    // nguoi nhan tra phi: true 
    // nguoi gui tra phi: false
    typeSend: Boolean, 
    fee: Number,
    createAt: {type:Date,default:Date.now},
})

mongoose.model('transaction',transactionSchema);