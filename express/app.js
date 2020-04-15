const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const errorController = require('./controllers/error');
const sequelize = require('./util/database');
const Product = require('./models/product');
const User = require('./models/user');
const Cart = require('./models/cart');
const CartItem = require('./models/cart-item');
const Order = require('./models/order');
const OrderItem = require('./models/order-item');

const app = express();

app.set('view engine', 'ejs');

// parse body before every other middleware
app.use(bodyParser.urlencoded({ extended: true }));

// allows to include css files as <link> in html files
// note: in those html files, we have to assume that we're already in the public dir
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    User
        .findByPk(1)
        .then(user => { // user = Sequelize object
            // add user field to req object (IT WILL BE AVAILABLE IN EVERY REQUEST)
            req.user = user;
            next();
        })
        .catch(err => {
            console.log(err);
        });
});

// prefix '/admin' to adminRoutes
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(errorController.get404);

// PRODUCT-USER RELATIONS: adds userId to products table
Product.belongsTo(User, { // This refers to a product owned by an admin user
    constraints: true,
    onDelete: 'CASCADE' // if user is deleted -> product is deleted
});
User.hasMany(Product); // OPTIONAL

// CART-USER RELATIONS: adds userId to cart table
Cart.belongsTo(User);
User.hasOne(Cart);

// CART-PRODUCT RELATIONS
// Since it is Many-to-Many, we need a new table that holds productId and cartId
// So, we connect them through CartItem
Cart.belongsToMany(Product, { through: CartItem }); // one Cart can hold many Products
Product.belongsToMany(Cart, { through: CartItem }); // a Product can be in different Carts

// ORDER-USER RELATIONS: adds userId to orders table
Order.belongsTo(User);
User.hasMany(Order);

// ORDER-PRODUCT RELATIONS
// Since it is Many-to-Many, we need a new table that holds productId and cartId
// So, we connect them through OrderItem
Order.belongsToMany(Product, { through: OrderItem }); // one Order can hold many Products
Product.belongsToMany(Order, { through: OrderItem }); // a Product can be in different Orders


// Create tables for defined models
sequelize
    // .sync({
    //     // just for development, not production (to replace tables and apply the newly defined relations)
    //     force: true
    // })
    .sync()
    .then(result => {
        return User.findByPk(1);
    })
    .then(user => {
        if (!user) {
            return User.create({
                name: 'Nico',
                email: 'nicoulmete1@gmail.com'
            });
        }

        // make sure that we return a Promise instead of a value
        return Promise.resolve(user);
    })
    .then(user => {
        return user.createCart();
        // console.log(user);
    })
    .then(cart => {
        app.listen(3000);
    })
    .catch(err => {
        console.log(err);
    });
