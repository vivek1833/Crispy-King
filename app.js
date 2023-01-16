const env = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");

const app = express();
const port = process.env.PORT || 8000;

const Register = require('./models/register');
// const { title } = require("process");   // dont know what it does
const conn = process.env.DataBase;

mongoose.set('strictQuery', false); // to not show warning

mongoose.connect(conn).then(() => {
  console.log("Database Connection Succesful");
}).catch((err) => console.log(`Database Connection Failed ...${err}`));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "./public")));
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "./templates/views/"));
hbs.registerPartials(path.join(__dirname, "./templates/partials/"));
app.use(cookieParser());

app.get("", (req, res) => {
  res.render("index", { title: "Login Successful" });
});

app.get("/order", auth, (req, res) => {
  res.render("logged_index");
});

app.get("/logout", auth, async (req, res) => {
  try {
    // logout from one device
    req.user.tokens = req.user.tokens.filter((currentElement) => {
      return currentElement.token !== req.token;
    })
    res.clearCookie("jwt");
    console.log("Logout Successful");
    await req.user.save();
    res.render("index");

    // // logout from all devices
    // req.user.tokens = [];
    // res.clearCookie("jwt");
    // console.log("Logout Successful");
    // await req.user.save();
    // res.render("index");

  } catch (error) {
    res.status(500).send(error);
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

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
      user.tokens = user.tokens.concat({ token: token });

      // Cookie generation
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 300000),
        httpOnly: true
      });

      const registered = await user.save();
      console.log("User Registered");
      res.status(201).render("logged_index");

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
      useremail.tokens = useremail.tokens.concat({ token: token });
      // console.log(token);

      // Cookie generation
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 300000),
        httpOnly: true
      });
      console.log("User Logged In");
      res.status(201).render("logged_index");

    } else {
      res.status(400).render("login", { title: "Invalid Credentials" });
    }
  } catch (error) {
    res.status(400).render(`login ${error}`);
  }
})

// npm run dev
app.listen(port, () => {
  console.log(`Running on http://localhost:${port}`);
});
