const mongoose = require('mongoose');
const { Schema } = mongoose;

const deptReminderSchema = new Schema({
    idBankAccount: Schema.Types.ObjectId,
    userId: Schema.Types.ObjectId,
    bankAccountSender: String,
    bankAccountReceiver: String,
    amount: Number,
    contentNotification: String,
    isRead: Boolean,
    isDelete: { type: Boolean, default: false },
    createAt: { type: Date, default: Date() },
    iat: Number,
    type: String,
    linkTo: String,
})

mongoose.model('deptReminder', deptReminderSchema);
