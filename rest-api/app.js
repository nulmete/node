const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const graphqlHttp = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');

const config = require('./config');

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
    
    // graphql
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

app.use(auth);

app.use('/graphql', graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(err) {
        // originalError: error thrown in code
        // technical error is not an originalError (e.g. syntax error)
        if (!err.originalError) {
            // return normal error
            return err;
        }

        const data = err.originalError.data;
        const message = err.message || 'An error occurred.';
        const statusCode = err.originalError.statusCode || 500;
        return { message, status: statusCode, data };
    }
}));

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
    res.status(statusCode).json({ message, data, where: 'error-handling middleware' });
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
