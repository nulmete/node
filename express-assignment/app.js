const express = require('express');
const path = require('path');

const app = express();

const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/register');

// allows to include css files as <link> in html files
// note: in those html files, we have to assume that we're already in the public dir
app.use(express.static(path.join(__dirname, 'public')));

// admin page to see registered users
app.use('/admin', adminRoutes);

// register page for new users
app.use(userRoutes);

// handle 404
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

app.listen(3000);
