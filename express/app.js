const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const sequelize = require('./util/database');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const errorController = require('./controllers/error');

const app = express();

app.set('view engine', 'ejs');

// parse body before every other middleware
app.use(bodyParser.urlencoded({ extended: true }));

// allows to include css files as <link> in html files
// note: in those html files, we have to assume that we're already in the public dir
app.use(express.static(path.join(__dirname, 'public')));

// prefix '/admin' to adminRoutes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(errorController.get404);


// Create tables for defined models
sequelize
    .sync()
    .then(result => {
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    });
