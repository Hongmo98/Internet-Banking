const mongoose = require('mongoose');
const { Schema } = mongoose;

const receiverInfoSchema = new Schema({
    numberAccount: String,
    nameRemind: { type: String, "index": "text" },
    idBank: Schema.Types.ObjectId,
    nameBank: { type: String, "index": "text" },
    createAt: { type: Date, default: Date.now },
    userId: Schema.Types.ObjectId,
    isDelete: { type: Boolean, default: false },




})

module.exports = mongoose.model('receiverInfo', receiverInfoSchema);


