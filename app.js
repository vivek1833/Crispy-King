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
const Food = require('./models/food')
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

  res.render("index", {
    food: foods
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

// Search Bar
app.post("/search", async (req, res) => {
  try {
    const search = req.body.search;
    const foods = await Food.find({ name: { $regex: search, $options: 'i' } });
    res.render("index", {
      food: foods
    });
  } catch (error) {
    res.status(400).send("No item found");
  }
})

// Logout user
app.get("/logout", async (req, res) => {
  try {
    res.clearCookie("jwt");
    console.log("Logout Successful");
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
      user.tokens = user.tokens.concat({ token: token });

      // Cookie generation
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 3 * 60 * 60),
        httpOnly: true
      });

      // Saving in database
      const registered = await user.save();
      console.log("User Registered");
      res.status(201).render("index", { title: "LogOut" });

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
        expires: new Date(Date.now() + 3 * 60 * 60),
        httpOnly: true
      });
      // Saving in database
      const loggedin = await useremail.save();

      console.log("User Logged In");
      const foods = await Food.find();
      res.status(201).render("index", { user: useremail, food: foods });

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
