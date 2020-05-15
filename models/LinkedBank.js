const mongoose= require('mongoose');
const {Schema}= mongoose;

const linkedBankSchema=({
    // not finished
    name: String, 
    codeBank: String 
})

mongoose.model('linkedBank',linkedBankSchema);