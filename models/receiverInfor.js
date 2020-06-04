const mongoose = require('mongoose');
const { Schema } = mongoose;

const receiverInfoSchema = new Schema({
    numberAccount: String,
    nameAccount: String,
    idBank: Schema.Types.ObjectId,
    createAt: { type: Date, default: Date.now },
    userId: Schema.Types.ObjectId,
    isDelete: { type: Boolean, default: false },



})

module.exports = mongoose.model('receiverInfo', receiverInfoSchema);


