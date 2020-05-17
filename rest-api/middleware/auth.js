const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (req, res, next) => {
    // check if user sent the token
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        // const error = new Error('Not authenticated.');
        // error.statusCode = 401;
        // throw error;
        req.isAuth = false;
        return next();
    }

    // extract the token, remove 'Bearer '
    const token = authHeader.split(' ')[1];
    let decodedToken;

    // verify if token is valid
    try {
        decodedToken = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
        // err.statusCode = 500;
        // throw err;
        req.isAuth = false;
        return next();
    }

    // didn't fail "technically", but failed to verify the token
    if (!decodedToken) {
        // const error = new Error('Not authenticated.');
        // error.statusCode = 401;
        // throw error;
        req.isAuth = false;
        return next();
    }

    // valid token, store userId to use it everywhere
    req.userId = decodedToken.userId;
    req.isAuth = true;
    next();
};
