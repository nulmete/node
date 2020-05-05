const express = require('express');
const bodyParser = require('body-parser');

const feedRoutes = require('./routes/feed');

const app = express();

// x-www-form-urlencoded => data submitted through <form>
// app.use(bodyParser.urlencoded()); 

// parse JSON data from incoming requests (application/json)
app.use(bodyParser.json()); 

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

app.listen(8080);
