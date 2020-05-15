const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cookieSession = require('cookie-session');
const keys = require('./config/key');
const bodyParser = require('body-parser');
const passport = require('passport');
const mongoose = require('mongoose');
mongoose.connect(keys.mongoURI,
    { useNewUrlParser: true, useUnifiedTopology: true, 'useCreateIndex': true });
var app = express();
app.use(express.json())
app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));


require('./middlewares/loadMongoose');


app.use('/user', require('./routes/bankRoutes'));

app.use((req, res, next) => {
    res.status(404).json({ error: { message: ' This API still not support' } });
})
app.use((req, res, next) => {
    res.status(600).json(error);
})

app.listen(5000, () => {
    console.log('Open at http://localhost:5000');
})
