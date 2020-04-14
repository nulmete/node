const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false
    });
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;
    const description = req.body.description;
    const price = req.body.price;

    // method available because of the User-Product relation
    // adds the userId automatically without specifying it inside the object
    req.user
        .createProduct({
            title,
            price,
            imageUrl,
            description,
            // userId: req.user.id
        })
        .then(result => {
            console.log('CREATED PRODUCT');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getEditProduct = (req, res, next) => {
    // check if query param exists (it returns "true" as a String)
    const editMode = req.query.edit;

    if (!editMode) return res.redirect('/');

    const prodId = req.params.productId;

    // method available because of the User-Product relation
    // edit product (with specific ID) that belongs to an user
    req.user
        .getProducts({ // returns an array of products
            where: { id: prodId }
        })
        .then(products => {
            const product = products[0];

            if (!product) {
                return res.redirect('/');
            }
    
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postEditProduct = (req, res, next) => {
    // fetch product info from edit-product.ejs
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedImgUrl = req.body.imageUrl;
    const updatedDescription = req.body.description;
    const updatedPrice = req.body.price;

    // there's no need to change this method to a Sequelize method,
    // because, at this point, we already know that this product
    // belongs to a specific user who has previously edited the product
    Product
        .findByPk(prodId)
        .then(product => {
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.imageUrl = updatedImgUrl;
            product.description = updatedDescription;
            return product.save();
        })
        .then(result => {
            console.log('UPDATED PRODUCT');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    // there's no need to change this method to a Sequelize method,
    // because, at this point, we already know that this product
    // belongs to a specific user who has previously seen all of his/her products
    Product
        .findByPk(prodId)
        .then(product => {
            return product.destroy();
        })
        .then(result => {
            console.log('PRODUCT DESTROYED');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getProducts = (req, res, next) => {
    // method available because of the User-Product relation
    // get all products that belong to an user
    req.user
        .getProducts()
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products'
            });
        })
        .catch(err => {
            console.log(err);
        });
};