const express = require('express');

// check: checks all fields (body, params, cookies, headers)
// body: just checks the req.body
const { check, body } = require('express-validator/check');

const authController = require('../controllers/auth');
const User = require('../models/user');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid e-mail')
            .normalizeEmail(),
        body(
            'password',
            'Please enter a password with only numbers and text and at least 5 characters' 
        )
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim()
    ], 
    authController.postLogin
);

// check input with name="email"
router.post(
    '/signup',
    // validation block
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid e-mail')
            .custom(value => {
                return User
                    .findOne({ email: value })
                    .then(userData => {
                    if (userData) {
                        // user exists, throw err inside of the promsie
                        return Promise.reject('E-mail already exists.');
                    }
                });
            })
            .normalizeEmail(),
        body(
            'password',
            'Please enter a password with only numbers and text and at least 5 characters'
        )
            .isLength({ min: 5 })
            .isAlphanumeric()
            .trim(),
        body('confirmPassword')
            .trim()
            .custom((value, { req }) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords must match!');
                }
                return true;
            })
    ],
    authController.postSignup
);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;