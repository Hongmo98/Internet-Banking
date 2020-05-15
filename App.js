const express = require('express');
const morgan = require('morgan')
var app = express();

app.use(express.json())
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    res.json({
        msg: 'hello from nodejs express api'
    });
})


app.listen(process.env.PORT || 5000, () => {
    console.log('open http://localhost:5000');
})

