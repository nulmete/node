const path = require('path');
const express = require('express');
const rootDir = require('../util/path');

const router = express.Router();

const products = [];

// GET /admin/add-product
router.get('/add-product', (req, res, next) => {
    // res.sendFile(path.join(rootDir, 'views', 'add-product.html'));
    // pass hardcoded path to pug template to know which nav link is active
    res.render('add-product', { pageTitle: 'Add Product', path: '/admin/add-product' });
});

// POST /admin/add-product
router.post('/add-product', (req, res, next) => {
    products.push({ title: req.body.title });
    res.redirect('/');
});

exports.routes = router;
exports.products = products;
