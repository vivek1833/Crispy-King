const env = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");
const Register = require('./models/register');
const Food = require('./models/food');
const Cart = require('./models/cart');
const { title } = require("process");
const app = express();
const port = process.env.PORT || 8000;
const conn = process.env.DataBase;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "./public")));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "./templates/views/"));
hbs.registerPartials(path.join(__dirname, "./templates/partials/"));
app.use(cookieParser());

mongoose.set('strictQuery', false); // to not show warning

mongoose.connect(conn, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Database Connected");
}).catch((err) => console.log(err));

app.get("/", async (req, res) => {
  const foods = await Food.find();
  const user = await Register.findOne({ token: req.cookies.jwt });

  if (user) {
    res.render("index", { user: user, food: foods });
  } else {
    res.render("index", { user: null, food: foods });
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

// Cart
app.get("/cart", auth, async (req, res) => {
  try {
    const user = await Cart.find({ username: req.user.username });
    const cart = [];

    for (let i = 0; i < user.length; i++) {
      const food = await Food.findOne({ _id: user[i].food });
      cart.push(food);
    }

    res.render("cart", {
      user: req.user,
      cart: cart
    });
  } catch (error) {
    res.status(400).render("cart", {
      user: user,
      cart: "No item in cart"
    });
  }
});

// Add to cart
app.get("/addtocart/:id", auth, async (req, res) => {
  try {
    const food = await Food.findOne({ _id: req.params.id });
    const cart = new Cart({
      username: req.user.username,
      food: req.params.id
    });

    const added = await cart.save();
    res.redirect("/");
  } catch (error) {
    res.render("login", { title: "Please login to add to cart" });
  }
});

// Delete from cart
app.get("/deletecart/:id", auth, async (req, res) => {
  try {
    const food = await Food.findOne({ _id: req.params.id });
    const cart = await Cart.findOne({ food: req.params.id });
    const deleted = await cart.remove();
    res.redirect("/cart");
  } catch (error) {
    res.status(400).send("Something went wrong");
  }
});

// Search Bar
app.post("/search", async (req, res) => {
  try {
    const search = req.body.search;
    const foods = await Food.find({ name: { $regex: search, $options: 'i' } });
    res.render("index", {
      user: "user",
      food: foods
    });
  } catch (error) {
    res.status(400).send("No item found");
  }
})

// Logout user
app.get("/logout", auth, async (req, res) => {
  try {
    res.clearCookie("jwt");
    const user = await Register.findOne({ token: req.cookies.jwt });
    user.token = "";
    res.render("login", { title: "Logout Successful" });

  } catch (error) {
    res.status(500).render("login", { title: "Logout Failed" });
  }
})

// Register validation
app.post("/register", async (req, res) => {
  try {
    const password = req.body.password;
    const confirmpassword = req.body.confirmpassword;

    // hashing password
    const hashpassword = await bcrypt.hash(password, 10);

    // inserting in database
    if (password === confirmpassword) {
      const user = new Register({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        username: req.body.username,
        password: hashpassword,
        confirmpassword: confirmpassword,
      })

      // Web token generation
      const token = jwt.sign({ _id: req.body._id }, process.env.SecretKey);
      user.token = token;

      // Saving in database
      const registered = await user.save();
      const foods = await Food.find();
      res.render("index", { user: registered, food: foods, token: token });
    } else {
      res.render("signup", { title: "Password not matching" });
    }
  } catch (err) {
    res.status(400).send(err);
  }
})

// Login validation
app.post("/login", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;

    // encrypting password and finding in database
    const useremail = await Register.findOne({ username: username });
    const isMatch = await bcrypt.compare(password, useremail.password);

    if (isMatch) {
      // Web token generation
      const token = jwt.sign({ _id: req.body._id }, process.env.SecretKey);
      useremail.token = token;

      // Saving in database
      const loggedin = await useremail.save();

      // Cookies
      res.cookie("jwt", token, {
        // expires after 1 day
        expires: new Date(Date.now() + 86400000),
        httpOnly: true
      });

      const foods = await Food.find();
      res.status(201).render("index", { user: useremail, food: foods, token: token });

    } else {
      res.status(400).render("login", { title: "Invalid Credentials" });
    }
  } catch (error) {
    res.status(400).render("login", { title: "Invalid Credentials!!!" });
  }
})

// 404 Error Page
app.get("*", (req, res) => {
  res.render("404error");
})

// npm run dev
app.listen(port, () => {
  console.log(`Running on http://localhost:${port}`);
});
