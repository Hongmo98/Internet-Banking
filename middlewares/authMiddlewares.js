var jwt = require('jsonwebtoken');
var createError = require('http-errors');
const config = require('./../config/key');

module.exports = function verify(req, res, next) {

    const token = req.headers['x-access-token'];

    if (token) {

        jwt.verify(token, config.SECRET_KEY, function (err, payload) {
            if (err)
                throw createError(401, err);

            req.tokePayload = payload;
            console.log(req.tokePayload);
            next();
        })
    } else {
        throw createError(401, 'No accessToken found');
    }
}
