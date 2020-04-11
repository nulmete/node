const fs = require('fs');
const path = require('path');
const rootDir = require('../util/path');

const p = path.join(rootDir, 'data', 'products.json');

const getProductsFromFile = (cb) => {
    fs.readFile(p, (err, fileContent) => {
        if (err) { // no products in products.json
            cb([]);
        } else {
            cb(JSON.parse(fileContent));
        }
    });
}

module.exports = class Product {
    constructor(title) {
        this.title = title;
    }

    save() {
        getProductsFromFile(products => {
            products.push(this);
            fs.writeFile(p, JSON.stringify(products), (err) => {
                console.log(err);
            });
        });
    }

    // static: we can call the method on the class itself,
    // not just on the instantiated object
    static fetchAll(callback) {
        // this is async code, so if we just return [] and JSON.parse(fileContent),
        // fetchAll runs every line of code but ONLY registers the callback fn
        // inside fs.readFile fn, so it's not executed.
        // therefore, we never return anything and we get products = undefined
        // in controllers/products.js
        // SOLUTION: once fetchAll is done executing, the 'callback' fn is called
        getProductsFromFile(callback);
    }
}