const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const config = require('./config');

const feedRoutes = require('./routes/feed');

const app = express();

// x-www-form-urlencoded => data submitted through <form>
// app.use(bodyParser.urlencoded()); 

// parse JSON data from incoming requests (application/json)
app.use(bodyParser.json()); 

// serve images statically
app.use('/images', express.static(path.join(__dirname, 'images')));

// prevent CORS
app.use((req, res, next) => {
    // Allow access from any client
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Speify which methods are allowed to the client
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    // Specify which headers are allowed to the client
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    next();
});

app.use('/feed', feedRoutes);

// express error-handling middleware
// executed every time an error is thrown or forwarded with next(err)
app.use((error, req, res, next) => {
    console.log(error);
    // if statusCode is undefined, set 500 by default
    const statusCode = error.statusCode || 500;
    const message = error.message;
    // message is always set as default
    res.status(statusCode).json({ message });
});

// connect to mongoose and then start server
mongoose
    .connect(
        `mongodb+srv://${config.MONGODB_USER}:${config.MONGODB_PW}@cluster0-xf55q.mongodb.net/messages?retryWrites=true&w=majority`
    )
    .then(result => {
        app.listen(8080);
    })
    .catch(err => {
        console.log(err);
    });
