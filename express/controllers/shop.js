const Product = require('../models/product');

exports.getIndex = (req, res, next) => {
    Product.findAll()
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/'
            });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getProducts = (req, res, next) => {
    Product.findAll()
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
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
    req.user
        .getCart()
        .then(cart => {
            return cart
                .getProducts()
                .then(products => {
                    res.render('shop/cart', {
                        path: '/cart',
                        pageTitle: 'Your Cart',
                        products
                    });
                })
                .catch(err => {
                    console.log(err);
                });
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    
    // used to access 'cart' variable if Product is not in the cart
    // (returned in the first .then() block)
    let fetchedCart;

    let newQuantity = 1;

    req.user
        .getCart()
        .then(cart => {
            fetchedCart = cart;
            return cart.getProducts({ where: { id: prodId } })
        })
        .then(products => {
            let product;
            if (products.length > 0) { // product is in the cart
                product = products[0];
            }
            if (product) { // get old quantity of the product and increase it
                // Sequelize provides the 'cartItem' property
                // since a Product has a many-to-many relation with Cart
                // through the Cart Item table
                const oldQuantity = product.cartItem.quantity;
                newQuantity = oldQuantity + 1;
                return Promise.resolve(product);
            }

            // Product is not in the cart -> add it for the FIRST time
            // newQuantity stays at 1
            return Product.findByPk(prodId);
        })
        .then(product => {
            // add product (which is, OR NOT, in the cart)
            return fetchedCart.addProduct(product, {
                through: { quantity: newQuantity }
            });
        })
        .then(() => {
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
        })
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;

    req.user
        .getCart()
        .then(cart => {
            return cart.getProducts({ where: { id: prodId } });
        })
        .then(products => {
            const product = products[0];

            // destroy the product in the cartItem table
            return product.cartItem.destroy();
        })
        .then(() => {
            res.redirect('/cart');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.postOrder = (req, res, next) => {
    let fetchedCart;

    req.user
        .getCart()
        .then(cart => {
            fetchedCart = cart;
            return cart.getProducts();
        })
        .then(products => {
            return req.user
                .createOrder()
                .then(order => {
                    return order.addProducts(products.map(product => {
                        // cannot do through: { quantity: product.quantity } bcz
                        // Product doesn't have a quantity then, retrieve quantity from cartItem table
                        product.orderItem = { quantity: product.cartItem.quantity };
                        return product;
                    }))
                })
                .catch(err => {
                    console.log(err);
                });
        })
        .then(result => {
            // clear the cart items
            return fetchedCart.setProducts(null);
        })
        .then(result => {
            res.redirect('/orders');
        })
        .catch(err => {
            console.log(err);
        });
};

exports.getOrders = (req, res, next) => {
    // watch the difference between getCart and this function!!!
    // we cannot nest .getProducts() because we want to render the orders, not the products
    // therefore, we do not have acces to a 'order.orderItem' property in our view
    // and we have to pass an object as an argument in order to fetch all the products
    req.user
        // 'products' = pluralization of the definition of 'product' in the Product model
        // EAGER LOADING
        // now, each order will have a 'products' array included
        // also, a every 'product' will have the 'product.orderItem' property
        .getOrders({ include: ['products'] })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders
            });
        })
        .catch(err => {
            console.log(err);
        });
};
