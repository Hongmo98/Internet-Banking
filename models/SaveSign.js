const mongoose = require('mongoose');
const { Schema } = mongoose;

const SaveSignSchema = new Schema({
    respone: {},
    sign: String,
    time: Date,
    type: { type: Boolean, default: 1 },
})

module.exports = mongoose.model('saveSign', SaveSignSchema);


