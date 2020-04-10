const express = require('express');
const bodyParser = require('body-parser');

const app = express();

const addUserData = require('./routes/add-user');
const usersRoute = require('./routes/users');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(addUserData.routes);
app.use(usersRoute);

app.listen(3000);
