const mongoose = require('mongoose');
const {Schema} = mongoose;

const staffSchema = new Schema({
    fullname: String,
    birthday: Date,
    gender: String,
    accountStaff: String,
    hashPassword: String,
    position: String
})

mongoose.model('staff',staffSchema);