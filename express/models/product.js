const fs = require('fs');
const path = require('path');
const rootDir = require('../util/path');

const Cart = require('./cart');

const p = path.join(rootDir, 'data', 'products.json');

const getProductsFromFile = (cb) => {
    fs.readFile(p, (err, fileContent) => {
        if (err) { // no products in products.json
            cb([]);
        } else {
            // add try-catch block to prevent JSON.parse error
            // when reading from an empty file
            try {
                cb(JSON.parse(fileContent));
            } catch (err) {
                return cb([]);
            }
            
        }
    });
}

module.exports = class Product {
    constructor(id, title, imageUrl, description, price) {
        this.id = id;
        this.title = title;
        this.imageUrl = imageUrl;
        this.description = description;
        this.price = price;
    }

    // add or edit products
    save() {
        getProductsFromFile(products => {
            if (this.id) { // don't create new ID if product id exists
                const existingProductIndex = products.findIndex(p => p.id === this.id);
                const updatedProducts = [...products];
                updatedProducts[existingProductIndex] = this;
                fs.writeFile(p, JSON.stringify(updatedProducts), (err) => {
                    console.log(err);
                });
            } else {
                // add unique ID to product
                this.id = Math.random().toString();
                products.push(this);
                fs.writeFile(p, JSON.stringify(products), (err) => {
                    console.log(err);
                });
            }
        });
    }

    // static: we can call the method on the class itself,
    // not just on the instantiated object
    static fetchAll(callback) {
        getProductsFromFile(callback);
    }

    static findById(id, cb) {
        getProductsFromFile(products => {
            const product = products.find(p => p.id === id);
            cb(product);
        });
    }

    static deleteById(id) {
        getProductsFromFile(products => {
            const product = products.find(prod => prod.id === id);
            // keep all products that don't have the same id of the product I want to delete
            const updatedProducts = products.filter(p => p.id !== id);

            fs.writeFile(p, JSON.stringify(updatedProducts), err => {
                if (!err) {
                    // also remove from cart (if it's there)
                    Cart.deleteProduct(id, product.price);
                }
            });
        });
    }
}