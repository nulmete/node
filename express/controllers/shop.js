const Product = require('../models/product');
const Cart = require('../models/cart');

exports.getIndex = (req, res, next) => {
    Product.fetchAll()
        .then(([rows, fieldData]) => {
            console.log(rows);
            res.render('shop/index', {
                prods: rows,
                pageTitle: 'Shop',
                path: '/'
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getProducts = (req, res, next) => {
    Product.fetchAll()
        .then(([rows, fieldData]) => {
            console.log(rows);
            res.render('shop/product-list', {
                prods: rows,
                pageTitle: 'All Products',
                path: '/products'
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;

    // Returns an array
    // Product.findAll({
    //     where: {
    //         id: prodId
    //     }
    // })
    //     .then(products => {
    //         res.render('shop/product-detail', {
    //             product: products[0],
    //             pageTitle: products[0].title,
    //             path: '/products',
    //         });
    //     })
    //     .catch(err => {
    //         console.log(err);
    //     });

    // Returns an object
    Product.findByPk(prodId)
        .then(product => {
            res.render('shop/product-detail', {
                pageTitle: product.title,
                path: '/products',
                product: product
            });
        })
        .catch(err => {
            console.log(err);
        });
};


exports.getCart = (req, res, next) => {
    Cart.getCart(cart => {
        // once I got the cart, fetch all products
        Product.fetchAll(products => {
            const cartProducts = [];

            // once I got the products, analyze the cart vs the products
            for (product of products) {
                // prod: product in the cart (id, qty)
                // product: product in list of products (id, title, desc, price, imgurl)
                const cartProductData = cart.products.find(prod => prod.id === product.id);
                if (cartProductData) {
                    // product is part of the cart
                    // store product details and quantity
                    cartProducts.push({ productData: product, qty: cartProductData.qty });
                }
            }

            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',

                // cartProducts: [ { productData: ...., qty: .... }, .... ]
                products: cartProducts
            });
        });

    });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId, product => {
        Cart.addProduct(prodId, product.price);
    });
    res.redirect('/cart');
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId, product => {
        Cart.deleteProduct(prodId, product.price);
        res.redirect('/cart');
    });
};

exports.getOrders = (req, res, next) => {
    res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders'
    });
};

exports.getCheckout = (req, res, next) => {
    res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout'
    })
};