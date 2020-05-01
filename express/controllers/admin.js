const { validationResult } = require('express-validator');
const Product = require('../models/product');
const mongoose = require('mongoose');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const description = req.body.description;
    const price = req.body.price;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title,
                imageUrl,
                description,
                price
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }
    
    const product = new Product({
        title,
        price,
        description,
        imageUrl,
        userId: req.user // same as req.user._id
    });

    product
        .save()
        .then(() => {
            console.log('created product');
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getEditProduct = (req, res, next) => {
    // check if query param exists (it returns "true" as a String)
    const editMode = req.query.edit;

    if (!editMode) return res.redirect('/');

    const prodId = req.params.productId;

    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
    
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                hasError: false,
                errorMessage: null,
                validationErrors: []
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    // fetch product info from edit-product.ejs
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedImgUrl = req.body.imageUrl;
    const updatedDescription = req.body.description;
    const updatedPrice = req.body.price;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                imageUrl: updatedImgUrl,
                description: updatedDescription,
                price: updatedPrice,
                _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    Product
        .findById(prodId)
        .then(product => {
            console.log('wtf');
            console.log(product.userId, req.user._id);
            // prevent users from editing another user's product
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }

            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDescription;
            product.imageUrl = updatedImgUrl;
            return product
                .save()
                .then(result => {
                    console.log('UPDATED PRODUCT');
                    res.redirect('/admin/products');
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    Product
        // prevent users from deleting another user's product
        .deleteOne({ _id: prodId, userId: req.user._id })
        .then(() => {
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    Product
        .find({ userId: req.user._id })
        // get title, price and exclude id (can also be done as 2nd argument of populate)
        // .select('title price -_id')
        // .populate('userId', 'title price -_id')
        // .populate('userId') // get all info from the user
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products'
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};