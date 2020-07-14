const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const keys = require('./config/key');
const bodyParser = require('body-parser');
const passport = require('passport');
const mongoose = require('mongoose');
var session = require('express-session');
var cors = require('cors')
require('express-async-errors');
require('dotenv').config();

mongoose.connect(keys.mongoURI,
    { useNewUrlParser: true, useUnifiedTopology: true, 'useCreateIndex': true });
var app = express();
app.use(session({
    secret: keys.SECRET_KEY,
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000
    },
    resave: false,
    saveUninitialized: false
}));
app.use(express.json());
app.use(cors());
app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

require('./middlewares/loadMongoose');
require('./utils/ws')



app.use('/user', require('./routes/bankRoutes'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/transfer', require('./routes/transactionRoutes'));
app.use('/employee', require('./routes/employeeRoutes'));
app.use('/history', require('./routes/historyRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

app.use((req, res, next) => {
    res.status(404).json({ error: { message: '  API NOT FOUND' } });
})

app.use((error, req, res, next) => {

    const statusCode = error.status || 500

    res.status(statusCode).json(error || "not found server");
})


app.listen(process.env.PORT || 5000, () => {
    console.log('Open at http://localhost:5000');
})
