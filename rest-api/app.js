const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const app = express();

// configure multer file storage
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4());
    }
});

// configure multer file filter (which formats are accepted)
const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

// x-www-form-urlencoded => data submitted through <form>
// app.use(bodyParser.urlencoded()); 

// parse JSON data from incoming requests (application/json)
app.use(bodyParser.json()); 

// register multer with fileStorage and fileFilter configuration
// 'image' is the field we expect to receive from the request
app.use(multer({storage: fileStorage, fileFilter: fileFilter }).single('image'));

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
app.use('/auth', authRoutes);

// express error-handling middleware
// executed every time an error is thrown or forwarded with next(err)
app.use((error, req, res, next) => {
    console.log(error);
    // if statusCode is undefined, set 500 by default
    const statusCode = error.statusCode || 500;
    // message is always set as default
    const message = error.message;
    // custom property
    const data = error.data;
    res.status(statusCode).json({ message, data });
});

// connect to mongoose and then start server
mongoose
    .connect(
        `mongodb+srv://${config.MONGODB_USER}:${config.MONGODB_PW}@cluster0-xf55q.mongodb.net/messages?retryWrites=true&w=majority`
    )
    .then(result => {
        const server = app.listen(8080);

        // setup socket.io
        const io = require('./socket').init(server);

        // socket.io event listener when client connects
        io.on('connection', socket => {
            console.log('Client connected');
        });
    })
    .catch(err => {
        console.log(err);
    });
