const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

// const adminRoutes = require('./routes/admin');
// const shopRoutes = require('./routes/shop');
// const errorController = require('./controllers/error');
const mongoConnect = require('./util/database');

const app = express();

app.set('view engine', 'ejs');

// parse body before every other middleware
app.use(bodyParser.urlencoded({ extended: true }));

// allows to include css files as <link> in html files
// note: in those html files, we have to assume that we're already in the public dir
app.use(express.static(path.join(__dirname, 'public')));

// app.use((req, res, next) => {
//     User
//         .findByPk(1)
//         .then(user => { // user = Sequelize object
//             // add user field to req object (IT WILL BE AVAILABLE IN EVERY REQUEST)
//             req.user = user;
//             next();
//         })
//         .catch(err => {
//             console.log(err);
//         });
// });

// prefix '/admin' to adminRoutes
// app.use('/admin', adminRoutes);
// app.use(shopRoutes);
// app.use(errorController.get404);

mongoConnect(client => {
    console.log(client);
    app.listen(3000);
});
