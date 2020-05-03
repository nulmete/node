const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 1;

exports.getIndex = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product
        .find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;

            return Product.find() // returns a cursor
                .skip((page - 1) * ITEMS_PER_PAGE) // page 2: (2 - 1) * 2 = 2 (skip first 2 items)
                .limit(ITEMS_PER_PAGE) // get only 2 items
        })
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;
    let totalItems;

    Product
        .find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;

            return Product.find() // returns a cursor
                .skip((page - 1) * ITEMS_PER_PAGE) // page 2: (2 - 1) * 2 = 2 (skip first 2 items)
                .limit(ITEMS_PER_PAGE) // get only 2 items
        })
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'All Products',
                path: '/products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
                product: product
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
                products
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
                    email: req.user.email,
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
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getOrders = (req, res, next) => {
    Order
        .find({ "user.userId": req.user._id })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId;

    Order
        .findById(orderId)
        .then(order => {
            if (!order) {
                return next(new Error('No order found'));
            }

            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized'));
            }

            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);

            // pdfDoc is a readableStream
            const pdfDoc = new PDFDocument();

            res.setHeader('Content-Type', 'application/pdf');
            //res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');
            res.setHeader('Content-Disposition', 'attachment; filename="' + invoiceName + '"');

            // open pipes
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            // set PDF text
            pdfDoc.fontSize(20).text('Invoice', {
                underline: true
            });

            pdfDoc.text('---------------------------');

            let totalPrice = 0;
            order.products.forEach(prod => {
                totalPrice += prod.quantity * prod.product.price;

                pdfDoc.fontSize(14).text(
                    prod.product.title +
                    ' - ' +
                    prod.quantity +
                    ' x $' +
                    prod.product.price
                );
            });

            pdfDoc.text('Total price: $' + totalPrice);

            // close pipes and send response
            pdfDoc.end();
        })
        .catch(err => {
            return next(err);
        });

    
};
