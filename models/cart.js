const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    "username": {
        type: String,
        required: true
    },
    "food": {
        type: String,
        required: true
    },
})

const Cart = new mongoose.model("cart", cartSchema);

module.exports = Cart;
