const jwt = require("jsonwebtoken");
const Register = require("../models/register");

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        const user = await Register.findOne({token});        
        req.token = token;
        req.user = user;
        next();
    } catch (error) {  
        console.log(error);
    }
}

module.exports = auth;