const jwt = require("jsonwebtoken");
const Register = require("../models/register");

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;  // jwt is the name of the cookie
        const verifyUser = jwt.verify(token, process.env.SecretKey);

        const user = await Register.findOne({ _id: verifyUser._id });
        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        res.status(401).render("login", { title: "Please login first" });
    }
}

module.exports = auth;