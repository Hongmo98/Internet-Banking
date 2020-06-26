var jwt = require('jsonwebtoken');
var createError = require('http-errors');
const config = require('./../config/key');

module.exports = function verify(roles) {
 
    return [
        (req, res, next) => {
            const token = req.headers['x-access-token'];
            console.log("token", token);

            if (token) {
                jwt.verify(token, config.SECRET_KEY, function (err, payload) {
                    if (err)
                        throw createError(401, err);
                    req.tokePayload = payload;
                    console.log(req.tokePayload);

                    if (roles !== req.tokePayload.role) {

                        return res.status(401).json({ message: 'Unauthorized' });
                    }

                    next();
                })
            } else {
                throw createError(401, 'No accessToken found');
            }
        }
    ]
}
