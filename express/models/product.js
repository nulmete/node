const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;
const User = require('./user');

class Product {
    constructor(title, price, description, imageUrl, id, userId) {
        this.title = title;
        this.price = price;
        this.description = description;
        this.imageUrl = imageUrl;

        // if id is passed as argument, create mongodb objectId
        // if not, leave it as null
        this._id = id ? new mongodb.ObjectId(id) : null;

        // we don't necessarily need all user info, just the id as in an SQL relation
        this.userId = userId;
    }

    save() {
        const db = getDb(); // connect to db
        let dbOp;

        if (this._id) {
            // update product
            dbOp = db.collection('products').updateOne(
                { _id: this._id },
                { $set: this }
            );
        } else {
            // insert new product
            dbOp = db.collection('products').insertOne(this);
        }
        return dbOp
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

    static findById(prodId) {
        const db = getDb(); // connect to db
        return db.collection('products')
            .find({ _id: new mongodb.ObjectId(prodId) })
            .next()
            .then(product => {
                console.log(product);
                return product;
            })
            .catch(err => {
                console.log(err);
            });
    }

    static deleteById(prodId, user) {
        const db = getDb();
        return db.collection('products')
            .deleteOne({ _id: new mongodb.ObjectId(prodId) })
            .then(result => {
                // also delete from cart if it's in the cart!
                const updatedCartItems = user.cart.items.filter(item => {
                    return item.productId.toString() !== prodId.toString();
                });

                return db
                    .collection('users')
                    .updateOne(
                        { _id: new mongodb.ObjectId(user._id)},
                        { $set: { cart: { items: updatedCartItems } } }
                    );
            })
            .catch(err => {
                console.log(err);
            });
    }
}

module.exports = Product;
