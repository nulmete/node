const bcrypt = require('bcryptjs');
// const nodemailer = require('nodemailer');
const sendgrid = require('@sendgrid/mail');
const config = require('../config');

const User = require('../models/user');


exports.getLogin = (req, res, next) => {
  let message = req.flash('error');

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }

  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  User
    .findOne({ email: email })
    .then(user => {
      if (!user) { // email doesn't exist
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
      }

      // email exists, validate pw
      bcrypt
        .compare(password, user.password)
        .then(doMatch => { // we get here even if passwords don't match
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save(err => {
              console.log(err);
              res.redirect('/');
            });
          }

          // invalid pw
          req.flash('error', 'Invalid email or password.');
          res.redirect('/login');
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        });
    })
    .catch(err => console.log(err));
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  User
    .findOne({ email: email })
    .then(userData => {
      if (userData) {
        // user exists
        req.flash('error', 'E-mail already exists.');
        return res.redirect('/signup');
      }

      return bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] }
          });
    
          return user.save();
        }) 
        .then(() => {
          res.redirect('/login');

          sendgrid.setApiKey(config.SENDGRID_API_KEY);

          const msg = {
            to: email,
            from: 'nicoulmete1@gmail.com',
            subject: 'Testing Sendgrid E-mail',
            text: 'XD',
            html: '<h1>LOL</h1>',
          };
          return sendgrid.send(msg);
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');

  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};
