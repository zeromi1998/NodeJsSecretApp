require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const ejs = require("ejs");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
mongoose.set("strictQuery", true);

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true }
  })
);

app.use(passport.initialize());

app.use(passport.session());
mongoose.connect(
  "mongodb+srv://prathameshdoshi0:root@cluster0.8jfyiuu.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true }
);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String,
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/secrets", (req, res) => {
  User.find({ secrets: { $ne: null } }, (err, user) => {
    if (err) {
      console.log(err);
    } else {
      if (user) {
        res.render("secrets", { userData: user });
      }
    }
  });
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", (req, res) => {
  const { secret } = req.body;
  //req.user will have user data frm passport js as session user logged in
  User.findById(req.user.id, (err, user) => {
    if (err) {
      consoloe.log(err);
    } else {
      if (user) {
        user.secret = secret;
        user.save(() => {
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = new User({
    username: username,
    password: password,
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { username, password } = req.body;

  User.register({ username: username }, password, (err, user) => {
    if (err) {
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, () => {
        // will get call when only user authenticcated
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(3000, () => {
  console.log("serve is running at 3000");
});
