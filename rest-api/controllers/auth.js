const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

const User = require('../models/user');

exports.signup = async (req, res, next) => {
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

    try {
        const hashedPassword = await bcrypt.hash(password, 12);

        // create user
        const user = new User({
            email,
            password: hashedPassword,
            name
        });

        await user.save()

        res.status(201).json({
            message: 'User created!'
        });
    } catch (err) {
        // server-side error
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // ASYNC CODE => throwing an error doesn't work here
        // (it doesn't look for the next error-handling middleware)
        next(err);
    }
};

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const user = await User.findOne({ email });

        // if user is undefined
        if (!user) {
            const error = new Error('User could not be found.');
            error.statusCode = 401;
            throw error;
        }

        // compare password with hashed password
        const isEqual = bcrypt.compare(password, user.password);

        if (!isEqual) {
            const error = new Error('Wrong password.')
            error.statusCode = 401;
            throw error;
        }

        // password matches, generate JWT
        const token = jwt.sign(
            {
                email: user.email,
                userId: user._id.toString()
            },
            // secret key
            config.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            token: token,
            userId: user._id.toString()
        });
    } catch (err) {
        // server-side error
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // ASYNC CODE => throwing an error doesn't work here
        // (it doesn't look for the next error-handling middleware)
        next(err);
    }   
};
