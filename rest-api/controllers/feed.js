const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    Post
        .find()
        .then(posts => {
            res.status(200).json({
                message: 'Fetched posts successfully.',
                posts
            });
        })
        .catch(err => {
            // server-side error
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            // ASYNC CODE => throwing an error doesn't work here
            // (it doesn't look for the next error-handling middleware)
            next(err);
        });
};

exports.createPost = (req, res, next) => {
    // extract validation errors from route middleware
    const errors = validationResult(req);

    // validation error
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect.');
        error.statusCode = 422;
        // SYNC CODE => throw the error exits the function and
        // looks for the next error-handling middleware
        throw error;
    }

    const title = req.body.title;
    const content = req.body.content;

    // create post
    // createdAt and _id are automatically created
    const post = new Post({
        title,
        content,
        imageUrl: 'images/InfraestructuraRed.png',
        creator: {
            name: 'Nicolas'
        },
    });

    // save post to DB
    post
        .save()
        .then(result => {
            console.log(result);

            res.status(201).json({
                message: 'Post created successfully!',
                post: result
            });
        })
        .catch(err => {
            // server-side error
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            // ASYNC CODE => throwing an error doesn't work here
            // (it doesn't look for the next error-handling middleware)
            next(err);
        });
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;

    Post
        .findById(postId)
        .then(post => {
            // no post was found
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                // even if I'm inside then (ASYNC CODE), throwing the error
                // means that the catch() block will execute, so next(error)
                // is not needed here
                throw error;
            }

            // post was found
            res.status(200).json({ message: 'Post fetched.', post });
        })
        .catch(err => {
            // server-side error
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            // ASYNC CODE => throwing an error doesn't work here
            // (it doesn't look for the next error-handling middleware)
            next(err);
        });
};
