const mongoose = require('mongoose')

const foodSchema = new mongoose.Schema({
    "url": {
        type: String,
        required: true
    },
    "name": {
        type: String,
        required: true,
    },
    "category": {
        type: String,
        required: true,
    },
    "price": {
        type: Number,
        required: true
    },
    "rating": {
        type: Number,
        required: true
    },
    "time": {
        type: Number,
        required: true
    },
    "discount": {
        type: Number,
        required: true
    }
})

const Food = new mongoose.model("food", foodSchema);

module.exports = Food;
