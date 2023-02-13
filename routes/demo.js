const express = require("express");

const bcryptjs = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  let inputData;
  console.log("I am here.");
  console.log(req.session.inputData);
  if (!req.session.inputData) {
    console.log("I am here 1.");
    inputData = {
      email: "",
      confirmEmail: "",
      password: "",
    };
  } else {
    inputData = {
      errorMessage: req.session.inputData.errorMessage,
      email: req.session.inputData.email,
      confirmEmail: req.session.inputData.confirmEmail,
      password: req.session.inputData.password,
    };
  }

  req.session.inputData = null;

  res.render("signup", { inputData: inputData });
});

router.get("/login", function (req, res) {
  let inputData;
  console.log("I am here.");
  console.log(req.session.inputData);
  if (!req.session.inputData) {
    console.log("I am here 1.");
    inputData = {
      email: "",
      password: "",
    };
  } else {
    inputData = {
      errorMessage: req.session.inputData.errorMessage,
      email: req.session.inputData.email,
      password: req.session.inputData.password,
    };
  }
  req.session.inputData = null;
  res.render("login", { inputData: inputData });

});

router.post("/signup", async function (req, res) {
  const inputData = req.body;
  
  if (
    !inputData.email ||
    !inputData["confirm-email"] ||
    !inputData.password ||
    inputData.email !== inputData["confirm-email"] ||
    inputData.password.trim() < 6
  ) {
    req.session.inputData = {
      errorMessage: "Invalid data - please check your data",
      email: inputData.email,
      confirmEmail: inputData["confirm-email"],
      password: inputData.password,
    };
    req.session.save(function () {
      res.redirect("/signup");
    });
    return;
  }

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: inputData.email });

  if (existingUser) {
    req.session.inputData = {
      errorMessage: "User with this email exsist in database.",
      email: inputData.email,
      confirmEmail: inputData["confirm-email"],
      password: inputData.password,
    };
    req.session.save(function () {
      res.redirect("/signup");
    });
    return;
  }

  const user = {
    email: inputData.email,
    confirmEmail: inputData["confirm-email"],
    password: await bcryptjs.hash(inputData.password, 12),
  };

  await db.getDb().collection("users").insertOne(user);
  req.session.inputData = null;
  req.session.save(function () {
    res.redirect("/admin");
  });
});

router.post("/login", async function (req, res) {
  const inputData = req.body;

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: inputData.email });

  if (!existingUser) {
    req.session.inputData = {
      errorMessage: "This email dont exsist in database.",
      email: inputData.email,
      password: inputData.password,
    };
    req.session.save(function () {
      res.redirect("/login");
    });
    
    return;
  }

  const equalPassword = await bcryptjs.compare(
    inputData.password,
    existingUser.password
  );
  console.log(equalPassword);
  if (!equalPassword) {

    req.session.inputData = {
      errorMessage: "User credential are invalid - pleaase enter valid data.",
      email: inputData.email,
      password: inputData.password,
    };
    req.session.save(function () {
      res.redirect("/login");
    });
    
    return;
  }

  req.session.user = {
    id: existingUser._id,
    email: existingUser.email,
  };
  req.session.isAuthenticated = true;
  req.session.inputData = null;
  req.session.save(function () {
    
    res.redirect("/admin");
  });
});

router.get("/admin", function (req, res) {
  res.render("admin");
});

router.get("/profile", function (req, res) {
  res.render("profile");
});

router.post("/logout", function (req, res) {
  req.session.user = null;
  req.session.isAuthenticated = false;

  res.redirect('/');
});

module.exports = router;
