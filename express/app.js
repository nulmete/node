const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const adminData = require('./routes/admin');
const shopRoutes = require('./routes/shop');

// set values globally on express application
app.set('view engine', 'pug');
// no need to do this, because ./views is the default value
app.set('views', 'views');

// parse body before every other middleware
app.use(bodyParser.urlencoded({ extended: true }));

// allows to include css files as <link> in html files
// note: in those html files, we have to assume that we're already in the public dir
app.use(express.static(path.join(__dirname, 'public')));

// prefix '/admin' to adminRoutes
app.use('/admin', adminData.routes);

app.use(shopRoutes);

// handle 404
app.use((req, res, next) => {
    // res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
    res.status(404).render('404', { pageTitle: 'Page not found' });
});

app.listen(3000);
