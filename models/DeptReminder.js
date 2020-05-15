const mongoose=require('mongoose');
const {Schema}= mongoose;

const deptReminderSchema= new Schema({
    idBankAccount : Schema.Types.ObjectId,
    amount: Number,
    contentNotification: String,
    isRead: Boolean,
    isDelete: Boolean,
    createAt: { type: Date, default: Date() },
    updateAt: Date
})

mongoose.model('deptReminder', deptReminderSchema);