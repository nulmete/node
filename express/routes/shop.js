const path = require('path');
const express = require('express');
const rootDir = require('../util/path');

const router = express.Router();

// access to products from admin.js
const adminData = require('./admin');

router.get('/', (req, res, next) => {
    // shared between users (even after reloading the page, it stays on node server)
    console.log('shop.js: ', adminData.products);

    const products = adminData.products;

    // __dirname: absolute path to this folder
    // res.sendFile(path.join(rootDir, 'views', 'shop.html'));

    // render pug instead of html
    // pass data to pug template as an object
    res.render('shop', { prods: products, pageTitle: 'Shop', path: '/' });
});

module.exports = router;
