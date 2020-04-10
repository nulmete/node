const fs = require('fs');
const path = require('path');
const rootDir = require('../util/path');

module.exports = class Product {
    constructor(title) {
        this.title = title;
    }

    save() {
        const p = path.join(rootDir, 'data', 'products.json');

        fs.readFile(p, (err, fileContent) => {
            let products = [];

            if (!err) { // there are products stored
                products = JSON.parse(fileContent);
            }

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
        const p = path.join(rootDir, 'data', 'products.json');

        fs.readFile(p, (err, fileContent) => {
            if (err) { // no products in products.json
                // return [];
                callback([]);
            }

            // return JSON.parse(fileContent);
            callback(JSON.parse(fileContent));
        });
    }
}