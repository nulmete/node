const express = require('express');
const { body } = require('express-validator');

const router = express.Router();

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

router.get('/add-product', isAuth, adminController.getAddProduct);

router.post(
    '/add-product',
    [
        body('title')
            .isLength({ min: 3 })
            .trim(),
        body('price')
            .isFloat(),
        body('description')
            .isLength({ min: 8, max: 200 })
            .trim(),
    ],
    isAuth,
    adminController.postAddProduct
);

router.get('/products', isAuth, adminController.getProducts);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post(
    '/edit-product',
    [
        body('title')
            .isLength({ min: 3 })
            .trim(),
        body('price')
            .isFloat(),
        body('description')
            .isLength({ min: 8, max: 200 })
            .trim(),
    ],
    isAuth,
    adminController.postEditProduct
);

router.delete('/product/:productId', isAuth, adminController.deleteProduct); 

module.exports = router;
