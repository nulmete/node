const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const sendgrid = require('@sendgrid/mail');
const config = require('../config');

const User = require('../models/user');

sendgrid.setApiKey(config.SENDGRID_API_KEY);

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

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect('/reset');
    }

    const token = buffer.toString('hex');

    User
      .findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          req.flash('error', 'No account with that e-mail found');
          return res.redirect('/reset');
        }

        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user
          .save()
          .then(() => {
            // only redirect to home page if user was found
            res.redirect('/');

            // send token reset email
            const msg = {
              to: req.body.email,
              from: 'nicoulmete1@gmail.com',
              subject: 'Password Reset',
              html: `
                <p>You requested a password reset</p>
                <p>Click on this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
              `
            };

            sendgrid.send(msg);
          })
          .catch(err => {
            console.log(err);
          });
      })
      .catch(err => {
        console.log(err);
      });
  });
};

exports.getNewPassword = (req, res, next) => {
  // check if user token is valid and hasn't expired
  const token = req.params.token;
  User
    .findOne({
      resetToken: token,
      // check if expiration is in the future
      resetTokenExpiration: { $gt: Date.now() }
    })
    .then(user => {
      let message = req.flash('error');

      if (message.length > 0) {
        message = message[0];
      } else {
        message = null;
      }

      res.render('auth/new-password', {
        path: '/new-password',
        pageTitle: 'New Password',
        errorMessage: message,
        // include userId needed for the post request to update pw
        userId: user._id.toString(),
        passwordToken: token
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;

  User
    .findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId
    })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      console.log(err);
    });
};
