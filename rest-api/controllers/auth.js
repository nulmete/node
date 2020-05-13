const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.signup = (req, res, next) => {
    // collect validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;

    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            // create user
            const user = new User({
                email,
                password: hashedPassword,
                name
            });

            return user.save();
        })
        .then(result => {
            res.status(201).json({
                message: 'User created!',
                userId: result._id
            })
        })
        .catch(err => {
            // server-side error
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            // ASYNC CODE => throwing an error doesn't work here
            // (it doesn't look for the next error-handling middleware)
            next(err);
        });
};
