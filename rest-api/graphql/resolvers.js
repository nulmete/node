const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const config = require('../config')

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

    posts: async function(args, req) {
        if (!req.isAuth) {
            const error = new Error('Not authenticated.');
            error.statusCode = 401;
            throw error;
        }

        // pagination logic

        const totalPosts = await Post.find().countDocuments();
        const posts = await Post.find().sort({ createdAt: -1 }).populate('creator');

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
    }
};
