const mongoose = require('mongoose');
const { Schema } = mongoose;

const deptReminderSchema = new Schema({
    idBankAccount: Schema.Types.ObjectId,
    bankAccountSender: String,
    bankAccountReceiver: String,
    amount: Number,
    contentNotification: String,
    isRead: Boolean,
    isDelete: { type: Boolean, default: false },
    createAt: { type: Date, default: Date() },
    updateAt: Date
})

mongoose.model('deptReminder', deptReminderSchema);
