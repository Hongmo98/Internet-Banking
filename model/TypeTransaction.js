const mongoose = require('mongoose');
const {Schema} = mongoose;

const typeTransactionSchema = new Schema ({
    name: String,
    description: String
})

mongoose.model ('typeTransaction',typeTransactionSchema);