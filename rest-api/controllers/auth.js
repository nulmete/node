const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

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

exports.login = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;

    // email exists?
    User
        .findOne({ email })
        .then(user => {
            // user undefined?
            if (!user) {
                const error = new Error('User could not be found.');
                error.statusCode = 401;
                throw error;
            }

            // user was found
            loadedUser = user;

            // compare password with hashed password
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password.')
                error.statusCode = 401;
                throw error;
            }

            // password matches, generate JWT
            const token = jwt.sign(
                {
                    email: loadedUser.email,
                    userId: loadedUser._id.toString()
                },
                // secret key
                config.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.status(200).json({
                token: token,
                userId: loadedUser._id.toString()
            });
        })
        .catch(err => {
            // server-side error
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            // ASYNC CODE => throwing an error doesn't work here
            // (it doesn't look for the next error-handling middleware)
            next(err);
        })
};
