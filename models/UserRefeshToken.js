const mongoose = require('mongoose');
const { Schema } = mongoose;

const userRefreshSchema = new Schema({
    userId: String,
    refreshToken: String,
    Time: { type: Date, default: Date.now },
})

mongoose.model('userRefresh', userRefreshSchema);
