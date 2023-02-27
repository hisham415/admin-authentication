const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  let sessionInputData = req.session.inputData;

  if(!sessionInputData){
    sessionInputData = {
      hasError: false,
      email: '',
      confirmEmail: '',
      password: '',
    };
  }
  req.session.inputData = null;
  res.render("signup", {inputData: sessionInputData});
});

router.get("/login", function (req, res) {
  let sessionInputData = req.session.inputData;

  if(!sessionInputData){
    sessionInputData = {
      hasError: false,
      email: '',
      password: '',
    };
  }
  req.session.inputData = null;
  res.render("login", {inputData: sessionInputData});
});

router.post("/signup", async (req, res) => {
  const userData = req.body;
  const email = userData.email;
  const confirmEmail = userData["confirm-email"];
  const password = userData.password;
  if (
    !email ||
    !confirmEmail ||
    !password ||
    email !== confirmEmail ||
    !email.includes("@")
  ) {
    req.session.inputData = {
      hasError: true,
      message: "Invalid input - please check your data",
      email: email,
      confirmEmail: confirmEmail,
      password: password
    };
    req.session.save( function (){
     res.redirect('/signup');
    });
    return;
  }

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: email });
  if (existingUser) {
    req.session.inputData = {
      hasError: true,
      message: "User Exists already!",
      email: email,
      confirmEmail: confirmEmail,
      password: password
    };
    req.session.save(function(){
      res.redirect("/signup");

    });
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 12);
  const user = {
    email: email,
    password: hashedPassword,
  };
  await db.getDb().collection("users").insertOne(user);

  res.redirect("/login");
});

router.post("/login", async (req, res) => {
  const userEmail = req.body.email;
  const userPassword = req.body.password;

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: userEmail });

  if (!existingUser) {
    req.session.inputData = {
      hasError: true,
      message: "Could not log you in - please check your credentials!",
      email: userEmail,
      password: userPassword
    };
    req.session.save(()=>{
      res.redirect("/login");
    });
    return; 
  }
  const isPassword = await bcrypt.compare(userPassword, existingUser.password);
  if (!isPassword) {
    req.session.inputData = {
      hasError: true,
      message: "Could not log you in - please check your credentials!",
      email: email,
      confirmEmail: confirmEmail,
      password: password
    };
    req.session.save(()=>{
      res.redirect("/login");
    });
    return; 
  }
  req.session.user = { id: existingUser._id, enail: existingUser.email};
  req.session.isAuthenticated = true;
  req.session.save(() => {
    res.redirect("/admin");
  });
});

router.get("/admin", async (req, res) => {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }
  if( !res.locals.isAdmin){
    return res.status(403).render('403')
  }
  return res.render("admin");
});
router.get("/profile", (req, res) => {
  if (!res.locals.isAuth) {
    return res.status(401).render("401");
  }
  res.render("profile");
});

router.post("/logout", (req, res) => {
  req.session.user = null;
  req.session.isAuthenticated = false;
  res.redirect("/");
});

module.exports = router;
