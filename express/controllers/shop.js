const Product = require('../models/product');
const Order = require('../models/order');

exports.getIndex = (req, res, next) => {
    // find doesn't return a cursos like in normal mongodb
    // we have to add .cursor() to do that
    Product.find()
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getProducts = (req, res, next) => {
    Product.find()
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'All Products',
                path: '/products',
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    console.log('params: ', req.params);

    Product.findById(prodId)
        // mongoose automatically converts our string prodId
        // to an ObjectId
        .then(product => {
            console.log('product: ', product);
            res.render('shop/product-detail', {
                pageTitle: product.title,
                path: '/products',
                product: product,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate() // to return a promise
        .then(user => {
            const products = user.cart.items;

            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;

    Product
        .findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            console.log(result);
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    req.user
        .removeFromCart(prodId)
        .then(result => {
            console.log('removed from cart');
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postOrder = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate() // to return a promise
        .then(user => {
            console.log(user.cart.items);

            const products = user.cart.items.map(i => {
                return {
                    quantity: i.quantity,
                    // get all product info nested in productId field returned (see console.log)
                    product: { ...i.productId._doc }
                }
            });

            const order = new Order({
                user: {
                    name: req.user.name,
                    userId: req.user
                },
                products
            });

            return order.save();
        })
        .then(() => {
            return req.user.clearCart();
        })
        .then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getOrders = (req, res, next) => {
    Order
        .find({ "user.userId": req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders,
                isAuthenticated: req.session.isLoggedIn
            });
        })
        .catch(err => {
            console.log(err);
        });
};
