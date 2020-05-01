const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const config = require('./config');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = config.MONGODB_CONNECTION;

const app = express();

const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

const csrfProtection = csrf();

app.set('view engine', 'ejs');

// parse body before every other middleware
app.use(bodyParser.urlencoded({ extended: true }));

// allows to include css files as <link> in html files
// note: in those html files, we have to assume that we're already in the public dir
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store
    })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    // set local variables and pass it to views
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    
    User
        .findById(req.session.user._id)
        .then(user => {
            // throw new Error('dummy');
            if (!user) {
                // prevent saving undefined to req.user if user was just deleted from DB
                return next();
            }

            // save Moongose User object to req.user
            req.user = user;
            next();
        })
        .catch(err => {
            // won't redirect to error middleware
            // throw new Error(err);
            next(new Error(err));
        });
});


// prefix '/admin' to adminRoutes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

// app.use(errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next) => {
    // res.status(error.httpStatusCode).render(...);
    // res.redirect('/500');
    res.status(500).render('500', {
        pageTitle: 'Error',
        path: '/500'
    });
});

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        app.listen(3000);
    })
    .catch(error => {
        console.log(error);
    });
