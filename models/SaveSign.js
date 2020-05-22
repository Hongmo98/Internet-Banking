const mongoose = require('mongoose');
const { Schema } = mongoose;

const SaveSignSchema = new Schema({
    respone: String,
    sign: String,
    time: Date,
})

module.exports = mongoose.model('savesign', SaveSignSchema);


