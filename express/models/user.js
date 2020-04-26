const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        items: [{
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }]
    }
});

userSchema.methods.addToCart = function(product) {
    const cartProductIndex = this.cart.items.findIndex(cp => {
        // id is an object in mongodb, so we convert them to strings to use ===
        return cp.productId.toString() === product._id.toString();
    });

    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) { // product already in cart
        newQuantity = this.cart.items[cartProductIndex].quantity + 1;
        updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else { // new product
        updatedCartItems.push({ 
            productId: product._id,
            quantity: newQuantity
        });
    }

    const updatedCart = { items: updatedCartItems };
    this.cart = updatedCart;

    return this.save();
};

userSchema.methods.removeFromCart = function(productId) {
    const updatedCartItems = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString();
    });

    this.cart.items = updatedCartItems;

    return this.save();
};

userSchema.methods.clearCart = function() {
    this.cart = { items: [] };
    return this.save();
};

module.exports = mongoose.model('User', userSchema);

// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;
// const ObjectId = mongodb.ObjectId;

// class User {
//     constructor(username, email, cart, id) {
//         this.name = username;
//         this.email = email;
//         this.cart = cart;
//         this._id = id;
//     }

//     save() {
//         const db = getDb(); // connect to db
//         return db.collection('users').insertOne(this);
//     }

    
//     addToCart(product) {
//         const cartProductIndex = this.cart.items.findIndex(cp => {
//             // id is an object in mongodb, so we convert them to strings to use ===
//             return cp.productId.toString() === product._id.toString();
//         });

//         let newQuantity = 1;
//         const updatedCartItems = [...this.cart.items];

//         if (cartProductIndex >= 0) { // product already in cart
//             newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//             updatedCartItems[cartProductIndex].quantity = newQuantity;
//         } else { // new product
//             updatedCartItems.push({ productId: new ObjectId(product._id), quantity: newQuantity });
//         }

//         const updatedCart = { items: updatedCartItems };

//         const db = getDb();
//         return db
//             .collection('users')
//             .updateOne(
//                 { _id: new ObjectId(this._id)},
//                 { $set: { cart: updatedCart } }
//             );
//     }

//     getCart() {
//         const db = getDb();

//         // store all productIds from users.cart.items
//         const productIds = this.cart.items.map(i => {
//             return i.productId;
//         })

//         return db
//             .collection('products')
//             .find({ _id: { $in: productIds } })
//             .toArray()
//             .then(products => {
//                 // console.log('PRODUCTS INNER JOIN:', products);
//                 // console.log('CART.ITEMS: ', productIds);

//                 return products.map(product => {
//                     return {
//                         ...product, 
//                         quantity: this.cart.items.find(item => {
//                             return item.productId.toString() === product._id.toString();
//                         }).quantity
//                     }
//                 })
//             });
//     }

//     deleteItemFromCart(productId) {
//         const updatedCartItems = this.cart.items.filter(item => {
//             return item.productId.toString() !== productId.toString();
//         });

//         const db = getDb();
//         return db
//             .collection('users')
//             .updateOne(
//                 { _id: new ObjectId(this._id)},
//                 { $set: { cart: { items: updatedCartItems } } }
//             );
//     }

//     addOrder() {
//         const db = getDb();

//         // get ALL product info and quantity
//         return this.getCart()
//             .then(products => {
//                 const order = {
//                     // items: this.cart.items,
//                     items: products,
//                     user: {
//                         _id: new ObjectId(this._id),
//                         name: this.name
//                     }
//                 };

//                 // insert order
//                 return db.collection('orders').insertOne(order);
//             })
//             .then(result => {
//                 // empty the cart locally after adding an order
//                 this.cart = { items: [] };

//                 // empty the cart in the db
//                 return db
//                     .collection('users')
//                     .updateOne(
//                         { _id: new ObjectId(this._id)},
//                         { $set: { cart: { items: [] } } }
//                     );
//             });
//     }

//     getOrders() {
//         const db = getDb();
//         return db
//             .collection('orders')
//             // find all orders for user
//             .find({ 'user._id': new ObjectId(this._id) })
//             .toArray();
//     }

//     static findById(userId) {
//         const db = getDb();
//         return db.collection('users').findOne({ _id: new ObjectId(userId) });
//     }
// }

// module.exports = User;
