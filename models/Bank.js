const mongoose= require('mongoose');
const {Schema}= mongoose;

const bankSchema=({
    name: String,
    codeBank: String
})

mongoose.model('bank',bankSchema);