const fs = require('fs');
const path = require('path');
const rootDir = require('../util/path');

const p = path.join(rootDir, 'data', 'cart.json');

module.exports = class Cart {
    // constructor() {
    //     this.products = [];
    //     this.totalPrice = 0;
    // }

    static addProduct(id, productPrice) {
        // fetch previous cart
        fs.readFile(p, (err, fileContent) => {
            // product: { id: number, qty: number }
            let cart = { products: [], totalPrice: 0 };

            if (!err) { // existing cart
                cart = JSON.parse(fileContent);
            }

            // analyze cart
            const existingProductIndex = cart.products.findIndex(prod => prod.id === id);
            const existingProduct = cart.products[existingProductIndex];
            let updatedProduct;

            if (existingProduct) { // existing product
                updatedProduct = { ...existingProduct };
                updatedProduct.qty = updatedProduct.qty + 1;
                cart.products = [...cart.products];
                cart.products[existingProductIndex] = updatedProduct;
            } else { // new product
                updatedProduct = { id: id, qty: 1 };
                cart.products = [...cart.products, updatedProduct];
            }

            // +productPrice = converto to number from string
            cart.totalPrice = cart.totalPrice + +productPrice;
            fs.writeFile(p, JSON.stringify(cart), err => {
                console.log(err);
            });
        });
    }

    static deleteProduct(id, price) {
        fs.readFile(p, (err, fileContent) => {
            if (err) {
                return;
            }

            const cart = JSON.parse(fileContent);
            const updatedCart = { ...cart };
            const product = updatedCart.products.find(p => p.id === id);

            // if product is not in the cart, finish
            if (!product) {
                return;
            }
            
            const productQty = product.qty;

            // update cart price
            updatedCart.totalPrice = updatedCart.totalPrice - price * productQty;

            // update cart products
            updatedCart.products = updatedCart.products.filter(prod => prod.id !== id);

            // update cart
            fs.writeFile(p, JSON.stringify(updatedCart), err => {
                console.log(err);
            });
        });
    }

    static getCart(cb) {
        fs.readFile(p, (err, fileContent) => {
            const cart = JSON.parse(fileContent);

            if (err) {
                cb(null);
            } else {
                cb(cart);
            }
        });
    }
}