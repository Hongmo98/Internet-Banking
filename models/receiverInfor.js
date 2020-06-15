const mongoose = require('mongoose');
const { Schema } = mongoose;

const receiverInfoSchema = new Schema({
    numberAccount: String,
    nameAccount: String,
    nameRemind: String,
    idBank: Schema.Types.ObjectId,
    createAt: { type: Date, default: Date.now },
    userId: Schema.Types.ObjectId,
    isDelete: { type: Boolean, default: false },
    //TRANSFER  DEPT
    type: { type: String, "index": "text", default: "TRANSFER" },

})

module.exports = mongoose.model('receiverInfo', receiverInfoSchema);


