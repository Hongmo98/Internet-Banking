const mongoose = require ('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    fullName: String,
    email: String,
    identifyCard: String,
    phone: String,
    birthday: Date,
    gender: String,
    address: String,
    avatar: { type: String, default: '/avata.png'},
    username: String,
    hashPassword: String,
    idBankAccount: Schema.Types.ObjectId
})

mongoose.Model('user',userSchema);