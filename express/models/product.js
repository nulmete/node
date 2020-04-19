const getDb = require('../util/database').getDb;

class Product {
    constructor(title, price, description, imageUrl) {
        this.title = title;
        this.price = price;
        this.description = description;
        this.imageUrl = imageUrl;
    }

    save() {
        const db = getDb(); // connect to db
        return db.collection('products') // connect to collection and insert Product
            .insertOne(this)
            .then(result => {
                console.log(result);
            })
            .catch(err => {
                console.log(err);
            }); 

    }

    static fetchAll() {
        const db = getDb(); // connect to db
        return db.collection('products')
            // returns a 'cursor'
            .find()
            // returns a JS array with ALL the documents (it's better to implement pagination)
            // returns a promise
            .toArray()
            .then(products => {
                console.log(products);
                return products;
            })
            .catch(err => {
                console.log(err);
            });
    }
}

module.exports = Product;
