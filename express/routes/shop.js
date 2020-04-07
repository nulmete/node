const path = require('path');
const express = require('express');
const rootDir = require('../util/path');

const router = express.Router();

// access to products from admin.js
const adminData = require('./admin');

router.get('/', (req, res, next) => {
    // shared between users (even after reloading the page, it stays on node server)
    console.log('shop.js: ', adminData.products);

    // __dirname: absolute path to this folder
    // res.sendFile(path.join(rootDir, 'views', 'shop.html'));

    // render pug instead of html
    res.render('shop');
});

module.exports = router;
