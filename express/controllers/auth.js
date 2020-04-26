const User = require('../models/user');

exports.getLogin = (req, res, next) => {
    console.log(req.session)
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        isAuthenticated: false
    });
};

exports.postLogin = (req, res, next) => {
    User
        .findById("5ea1ff30334e7326c484f63b")
        .then(user => {
            req.session.isLoggedIn = true;
            req.session.user = user;
            // wait for session to be created before redirecting
            req.session.save(err => {
                console.log(err);
                res.redirect('/');
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postLogout = (req, res, next) => {
    // clear session (cookie on client stays but session on db is destroyed)
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');
    });
};
