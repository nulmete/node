const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    // get current page from frontend (loadPosts)
    // if it's undefined, always start at page 1
    const currentPage = req.query.page || 1;
    // same value as in the frontend
    // would be better to pass this to the frontend
    const perPage = 2;
    let totalItems;

    Post
        .find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Post
                .find()
                // page 1 => skip 0 items
                // page 2 => skip 2 items
                // page 3 => skip 4 items
                .skip((currentPage - 1) * perPage)
                // limit the amount of items retrieved to 2 items
                .limit(perPage);
        })
        .then(posts => {
            res.status(200).json({
                message: 'Fetched posts successfully.',
                posts,
                totalItems
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
        })

    
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

    // check if image was received in the request
    if (!req.file) {
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }

    // find path of the image
    const imageUrl = req.file.path.replace("\\", "/");

    const title = req.body.title;
    const content = req.body.content;

    // create post
    // createdAt and _id are automatically created
    const post = new Post({
        title,
        content,
        imageUrl,
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

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;

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

    // either the user didn't change the image...
    let imageUrl = req.body.image;
    // ... or the user selected a new image
    if (req.file) {
        imageUrl = req.file.path.replace("\\", "/");
    }

    if (!imageUrl) {
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw Error;
    }

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

            // user uploaded a new image => clear old image from filesystem
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }

            // post was found => update it
            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            return post.save();
        })
        .then(result => {
            res.status(200).json({
                message: 'Post updated.',
                post: result
            })
        })
        .catch(error => {
            // server-side error
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            // ASYNC CODE => throwing an error doesn't work here
            // (it doesn't look for the next error-handling middleware)
            next(err);
        });
};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;

    Post
        .findById(postId)
        .then(post => {
            // check logged in user

            // no post was found
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                // even if I'm inside then (ASYNC CODE), throwing the error
                // means that the catch() block will execute, so next(error)
                // is not needed here
                throw error;
            }

            clearImage(post.imageUrl);

            return Post.findByIdAndRemove(postId);
        })
        .then(result => {
            console.log(result);
            res.status(200).json({ message: 'Deleted post.' });
        })
        .catch(error => {
            // server-side error
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            // ASYNC CODE => throwing an error doesn't work here
            // (it doesn't look for the next error-handling middleware)
            next(err);
        });
};

const clearImage = filePath => {
    // filepath: 'images/imagename.png'
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};
