const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const hbs = require("hbs");

const app = express();
const port = process.env.PORT || 8000;

const Register = require('./models/register');
const { title } = require("process");
const conn = "mongodb+srv://vivekyadav:1q2w3e4r5t@cluster0.35i0hyy.mongodb.net/DB?retryWrites=true&w=majority";
// Instead of DB write database_Name

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

app.get("", (req, res) => {
  res.render("index", { title: "" });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/register", async (req, res) => {
  try {
    const password = req.body.password;
    const confirmpassword = req.body.confirmpassword;

    // inserting in database
    if (password === confirmpassword) {
      const user = new Register({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        address: req.body.address,
        username: req.body.username,
        password: password,
      })
      const registered = await user.save();
      res.status(201).render("index", {user :""});
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

    const useremail = await Register.findOne({ username: username });
    if (useremail.password === password) {
      res.status(201).render("index", { user: "" });
    } else {
      res.status(400).render("login", { title: "Invalid Credentials" });
    }
  } catch (error) {
    res.status(400).render("login", { title: "Invalid Credentials" });
  }
})

// npm run dev
app.listen(port, () => {
  console.log(`Running on http://localhost:${port}`);
});
