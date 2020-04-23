const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();

app.set('view engine', 'ejs');

// parse body before every other middleware
app.use(bodyParser.urlencoded({ extended: true }));

// allows to include css files as <link> in html files
// note: in those html files, we have to assume that we're already in the public dir
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User
        .findById("5ea1ff30334e7326c484f63b")
        .then(user => {
            // add user field to req object (IT WILL BE AVAILABLE IN EVERY REQUEST)
            req.user = user;
            next();
        })
        .catch(err => {
            console.log(err);
        });
});

// prefix '/admin' to adminRoutes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(errorController.get404);

mongoose
    .connect('mongodb+srv://nicolas:nicolas@cluster0-xf55q.mongodb.net/shop?retryWrites=true&w=majority')
    .then(() => {
        // get first user found
        User.findOne().then(user => {
            if (!user) {
                const user = new User({
                    name: 'Nico',
                    email: 'nicoulmete1@gmail.com',
                    cart: {
                        items: []
                    }
                });
                user.save();
            }
        });
        app.listen(3000);
    })
    .catch(error => {
        console.log(error);
    });
