const express=require('express');
const router = express.Router();
const {getItems,addItem,removeItem}=require('../controllers/wishlist');
const isAuthenticated = require('../middleware/isAuthenticated');

router.get('/',isAuthenticated,getItems);
router.get('/add/:id',isAuthenticated,addItem);
router.get('/remove/:id',isAuthenticated,removeItem);

module.exports = router;