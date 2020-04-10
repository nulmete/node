// simulate a database of products
const products = [];

module.exports = class Product {
    constructor(title) {
        this.title = title;
    }

    save() {
        products.push(this);
    }

    // static: we can call the method on the class itself,
    // not just on the instantiated object
    static fetchAll() {
        return products;
    }
}