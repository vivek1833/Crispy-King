const mongoose = require('mongoose')
const validator = require('validator')

const regSchema = new mongoose.Schema({
    "name": {
        type: String,
        required: true,
    },
    "email": {
        type: String,
        required: true,
        unique: true,
    },
    "phone": {
        type: Number,
        required: true,
    },
    "address": {
        type: String,
    },
    "username": {
        type: String,
        required: true,
        unique: true
    },
    "password": {
        type: String,
        required: true
    },
    "confirmpassword": {
        type: String,
    },
    "tokens": [{
        token: {
            type: String,
            required: true
        }
    }]
})

const Register = new mongoose.model("newuser", regSchema);

module.exports = Register;
