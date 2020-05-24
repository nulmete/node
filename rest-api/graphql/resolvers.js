const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const config = require('../config')
const { clearImage } = require('../util/file');

const User = require('../models/user');
const Post = require('../models/post');

// logic executed for incoming queries
module.exports = {
    // userInput destructured from args
    createUser: async function({ userInput }, req) {
        const errors = [];
        if (!validator.isEmail(userInput.email)) {
            errors.push({ message: 'E-mail is invalid.' });
        }
        if (
            validator.isEmpty(userInput.password) ||
            !validator.isLength(userInput.password, { min: 5 })
        ) {
            errors.push({ message: 'Password too short.' });
        }
        if(errors.length > 0) {
            const error = new Error('Invalid input.');
            error.data = errors;
            error.statusCode = 422;
            throw error;
        }
        
        const existingUser = await User.findOne({ email: userInput.email });

        if (existingUser) {
            const error = new Error('User already exists.');
            throw error;
        }

        const hashedPassword = await bcrypt.hash(userInput.password, 12);
        const user = new User({
            email: userInput.email,
            name: userInput.name,
            password: hashedPassword
        });
        const createdUser = await user.save();

        // overwrite the _id field returned from createdUser._doc
        // because I need to return a String, according to the schema
        return { ...createdUser._doc, _id: createdUser._id.toString() };
    },

    login: async function ({ email, password }) {
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('User not found.');
            error.statusCode = 401;
            throw error;
        }

        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Password is incorrect.');
            error.statusCode = 401;
            throw error;
        }

        const token = jwt.sign(
            {
                email: user.email,
                userId: user._id.toString()
            },
            // secret key
            config.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return {
            token,
            userId: user._id.toString()
        };
    },

    createPost: async function({ postInput }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated.');
            error.statusCode = 401;
            throw error;
        }

        const errors = [];
        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
            errors.push({ message: 'Title is invalid.' });
        }
        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
            errors.push({ message: 'Content is invalid.' });
        }
        if(errors.length > 0) {
            const error = new Error('Invalid input.');
            error.data = errors;
            error.statusCode = 422;
            throw error;
        }

        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('Invalid user.');
            error.statusCode = 401;
            throw error;
        }

        const post = new Post({
            title: postInput.title,
            content: postInput.content,
            imageUrl: postInput.imageUrl,
            creator: user
        });

        const createdPost = await post.save();
        user.posts.push(createdPost);
        await user.save();

        return {
            ...createdPost._doc,
            _id: createdPost._id.toString(),
            createdAt: createdPost.createdAt.toISOString(),
            updatedAt: createdPost.updatedAt.toISOString(),
        };
    },

    posts: async function({ page }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated.');
            error.statusCode = 401;
            throw error;
        }

        // pagination logic
        if (!page) {
            page = 1;
        }

        const perPage = 2;
        const totalPosts = await Post.find().countDocuments();
        const posts = await Post
            .find()
            .skip((page - 1) * perPage)
            .limit(perPage)
            .sort({ createdAt: -1 })
            .populate('creator');

        return {
            posts: posts.map(p => {
                return {
                    ...p._doc,
                    _id: p._id.toString(),
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString()
                };
            }),
            totalPosts
        };
    },

    post: async function({ id }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated.');
            error.statusCode = 401;
            throw error;
        }

        const post = await Post.findById(id).populate('creator');
        if (!post) {
            const error = new Error('No post found');
            error.statusCode = 404;
            throw error;
        }

        return {
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        }
    },

    updatePost: async function({ id, postInput }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated.');
            error.statusCode = 401;
            throw error;
        }

        const post = await Post.findById(id).populate('creator');
        if (!post) {
            const error = new Error('No post found');
            error.statusCode = 404;
            throw error;
        }
        if (post.creator._id.toString() !== req.userId.toString()) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }

        const errors = [];
        if (validator.isEmpty(postInput.title) || !validator.isLength(postInput.title, { min: 5 })) {
            errors.push({ message: 'Title is invalid.' });
        }
        if (validator.isEmpty(postInput.content) || !validator.isLength(postInput.content, { min: 5 })) {
            errors.push({ message: 'Content is invalid.' });
        }
        if(errors.length > 0) {
            const error = new Error('Invalid input.');
            error.data = errors;
            error.statusCode = 422;
            throw error;
        }

        post.title = postInput.title;
        post.content = postInput.content;
        
        // update imageUrl IF user changed the image
        if (postInput.imageUrl !== 'undefined') {
            post.imageUrl = postInput.imageUrl;
        }

        const updatedPost = await post.save();
        return {
            ...updatedPost._doc,
            id: updatedPost._id.toString(),
            createdAt: updatedPost.createdAt.toISOString(),
            updatedAt: updatedPost.updatedAt.toISOString()
        };
    },

    deletePost: async function({ id }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated.');
            error.statusCode = 401;
            throw error;
        }

        const post = await Post.findById(id);
        if (!post) {
            const error = new Error('No post found');
            error.statusCode = 404;
            throw error;
        }
        // here post.creator is directly the userId, because
        // it is not populated in Post.findById(id)
        if (post.creator.toString() !== req.userId.toString()) {
            const error = new Error('Not authorized');
            error.statusCode = 403;
            throw error;
        }

        // remove image from filesystem
        clearImage(post.imageUrl);
        // remove post
        await Post.findByIdAndRemove(id);
        // remove post from user posts
        const user = await User.findById(req.userId);
        user.posts.pull(id);
        await user.save();
        return true;
    },

    user: async function(args, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated.');
            error.statusCode = 401;
            throw error;
        }
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('No user found');
            error.statusCode = 404;
            throw error;
        }
        return {
            ...user._doc,
            id: user._id.toString()
        }
    },

    updateStatus: async function({ status }, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated.');
            error.statusCode = 401;
            throw error;
        }
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('No user found');
            error.statusCode = 404;
            throw error;
        }
        user.status = status;
        await user.save();
        return {
            ...user._doc,
            id: user._id.toString()
        };
    }
};
