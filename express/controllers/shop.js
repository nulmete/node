const Product = require('../models/product');
const Cart = require('../models/cart');

exports.getProducts = (req, res, next) => {
    // const products = Product.fetchAll();
    // res.render('shop', {
    //     prods: products,
    //     pageTitle: 'Shop',
    //     path: '/'
    // });

    // once 'fetchAll' is done executing, call the 'callback' function
    // that is inside 'models/product'
    // this is to prevent getting 'undefined' from the model using return
    Product.fetchAll(products => {
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'All Products',
            path: '/products'
        });
    });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId, product => {
        res.render('shop/product-detail', {
            pageTitle: product.title,
            path: '/products',
            product: product
        });
    });
};

exports.getIndex = (req, res, next) => {
    Product.fetchAll(products => {
        res.render('shop/index', {
            prods: products,
            pageTitle: 'Shop',
            path: '/'
        });
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