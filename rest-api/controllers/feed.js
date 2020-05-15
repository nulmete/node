const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');


exports.getPosts = async (req, res, next) => {
    // get current page from frontend (loadPosts)
    // if it's undefined, always start at page 1
    const currentPage = req.query.page || 1;
    // same value as in the frontend
    // would be better to pass this to the frontend
    const perPage = 2;
    // let totalItems;

    try {
        const totalItems = await Post.find().countDocuments();

        const posts = await Post.find()
            // page 1 => skip 0 items
            // page 2 => skip 2 items
            // page 3 => skip 4 items
            .skip((currentPage - 1) * perPage)
            // limit the amount of items retrieved to 2 items
            .limit(perPage)
            // needed to show the author name on the frontend
            // since it expects post.creator.name
            .populate('creator');

        res.status(200).json({
            message: 'Fetched posts successfully.',
            posts,
            totalItems
        });
    } catch (err) {
        // server-side error
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // ASYNC CODE => throwing an error doesn't work here
        // (it doesn't look for the next error-handling middleware)
        next(err);
    }
};

exports.createPost = async (req, res, next) => {
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
    let creator;

    // create post
    // createdAt and _id are automatically created
    const post = new Post({
        title,
        content,
        imageUrl,
        creator: req.userId
    });

    try {
        await post.save();
        const user = await User.findById(req.userId);
        await user.posts.push(post);
        await user.save();

        res.status(201).json({
            message: 'Post created successfully!',
            post,
            creator: {
                _id: user._id,
                name: user.name
            }
        });
    } catch (err) {
        // server-side error
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // ASYNC CODE => throwing an error doesn't work here
        // (it doesn't look for the next error-handling middleware)
        next(err);
    }
};

exports.getPost = async (req, res, next) => {
    const postId = req.params.postId;

    try {
        // populate 'creator' since frontend expects post.creator.name
        const post = await Post.findById(postId).populate('creator');

        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ message: 'Post fetched.', post });
    } catch (err) {
        // server-side error
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // ASYNC CODE => throwing an error doesn't work here
        // (it doesn't look for the next error-handling middleware)
        next(err);
    }
};

exports.updatePost = async (req, res, next) => {
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

    try {
        const post = await Post.findById(postId)

        // no post was found
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            // even if I'm inside then (ASYNC CODE), throwing the error
            // means that the catch() block will execute, so next(error)
            // is not needed here
            throw error;
        }

        // check if post belongs to the currently logged in user
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized.');
            error.statusCode = 403;
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

        const result = await post.save();

        res.status(200).json({
            message: 'Post updated.',
            post: result
        })
    } catch (err) {
        // server-side error
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // ASYNC CODE => throwing an error doesn't work here
        // (it doesn't look for the next error-handling middleware)
        next(err);
    }
};

exports.deletePost = async (req, res, next) => {
    const postId = req.params.postId;

    try {
        const post = await Post.findById(postId);

        // no post was found
        if (!post) {
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            // even if I'm inside then (ASYNC CODE), throwing the error
            // means that the catch() block will execute, so next(error)
            // is not needed here
            throw error;
        }

        // check if post belongs to the currently logged in user
        if (post.creator.toString() !== req.userId) {
            const error = new Error('Not authorized.');
            error.statusCode = 403;
            throw error;
        }

        clearImage(post.imageUrl);

        await Post.findByIdAndRemove(postId);
        const user = await User.findById(req.userId);
        // remove deleted post from user.posts
        await user.posts.pull(postId);
        await user.save();

        res.status(200).json({ message: 'Deleted post.' });
    } catch (err) {
        // server-side error
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // ASYNC CODE => throwing an error doesn't work here
        // (it doesn't look for the next error-handling middleware)
        next(err);
    }
};

exports.getStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({
            message: 'Retrieved status successfully!',
            status: user.status
        });
    } catch (err) {
        // server-side error
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // ASYNC CODE => throwing an error doesn't work here
        // (it doesn't look for the next error-handling middleware)
        next(err);
    }
};

exports.updateStatus = async (req, res, next) => {
    const newStatus = req.body.status;

    try {
        const user = await User.findById(req.userId);

        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 404;
            throw error;
        }

        user.status = newStatus;
        await user.save();

        res.status(200).json({
            message: 'Updated status successfully!'
        });
    } catch (err) {
        // server-side error
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        // ASYNC CODE => throwing an error doesn't work here
        // (it doesn't look for the next error-handling middleware)
        next(err);
    }
};

const clearImage = filePath => {
    // filepath: 'images/imagename.png'
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};
