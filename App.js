const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cookieSession = require('cookie-session');
const keys = require('./config/key');
const bodyParser = require('body-parser');
const passport = require('passport');
const mongoose = require('mongoose');
var cors = require('cors')
require('express-async-errors');
require('dotenv').config();

mongoose.connect(keys.mongoURI,
    { useNewUrlParser: true, useUnifiedTopology: true, 'useCreateIndex': true });
var app = express();
app.use(express.json());
app.use(cors());
app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


require('./middlewares/loadMongoose');


app.use('/user', require('./routes/bankRoutes'));

app.use((req, res, next) => {
    res.status(404).json({ error: { message: ' This API still not support' } });
})
app.use((error, req, res, next) => {

    const statusCode = error.status || 500
    // console.log("mo");
    res.status(statusCode).json(error);
})


app.listen(process.env.PORT || 5000, () => {
    console.log('Open at http://localhost:5000');
})
