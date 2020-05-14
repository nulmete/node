const express = require('express');
const { body } = require('express-validator');

const feedController = require('../controllers/feed');
const isAuth = require('../middleware/isAuth');

const router = express.Router();

router.get('/posts', isAuth, feedController.getPosts);

router.post(
    '/post',
    isAuth,
    // validation middleware
    [
        body('title').trim().isLength({ min: 5 }),
        body('content').trim().isLength({ min: 5 })
    ],
    feedController.createPost
);

router.get('/post/:postId', isAuth, feedController.getPost);

router.put(
    '/post/:postId',
    isAuth,
    // validation middleware
    [
        body('title').trim().isLength({ min: 5 }),
        body('content').trim().isLength({ min: 5 })
    ],
    feedController.updatePost
);

router.delete('/post/:postId', isAuth, feedController.deletePost);

router.get('/status', isAuth, feedController.getStatus);

router.patch(
    '/status',
    isAuth,
    [
        body('status').trim().not().isEmpty()
    ],
    feedController.updateStatus
);

module.exports = router;
