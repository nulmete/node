const express = require('express');
const router = express.Router();

const addUserData = require('./add-user');

router.get('/users', (req, res, next) => {
    console.log('users.js: ', addUserData.users);
    const users = addUserData.users;
    res.render('users', { pageTitle: 'Users', path: '/users', users });
});

module.exports = router;
