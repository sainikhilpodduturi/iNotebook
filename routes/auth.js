const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fetchuser = require("../middleware/fetchuser");

//Route1: create a user using POST endpoint : /create . No login required
router.post(
  "/create",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password").isLength({ min: 5 }),
    body("name", "Enter a valid name").isLength({ min: 5 }),
  ],
  async (req, res) => {
    try {
      // Give error if validation is failed
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ success: "false", errors: errors.array() });
      }

      // Checking if the given is available in db or not
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        res.json({ success: "false", msg: "User already exists" });
      }

      // const user = User(req.body);
      // user.save();
      // res.send(req.body);
      else {
        // hashing and adding salt to the password
        let salt = await bcrypt.genSalt(10);
        let secPass = await bcrypt.hash(req.body.password, salt);

        user = await User.create({
          name: req.body.name,
          email: req.body.email,
          password: secPass,
        });

        let data = {
          user: {
            id: user.id,
          },
        };
        // usually this should be kept in any file like .env.local
        let JWT_SECRET = "mySecret";
        let authtoken = jwt.sign(data, JWT_SECRET);
        let success = "true";
        res.json({ success, authtoken });
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: "false", msg: "Internal Server Error" });
    }
  }
);

//Route2: login a user using POST endpoint: /login
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "password cannot be blank").exists(),
  ],
  async (req, res) => {
    let success;
    // Give error if validation is failed
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      success = "false";
      return res.status(400).json({ success, errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        success = "false";
        res
          .status(400)
          .json({ success, msg: "Username or Password is incorrect" });
      } else {
        //below function compare the password stored in db and entered by the user and gives true/false value
        const hashPass = await bcrypt.compare(password, user.password);
        if (!hashPass) {
          res
            .status(400)
            .json({ success, msg: "Username or Password is incorrect" });
        } else {
          let data = {
            user: {
              id: user.id,
            },
          };
          // usually this should be kept in any file .env.local
          let JWT_SECRET = "mySecret";
          let authtoken = jwt.sign(data, JWT_SECRET);
          success = "true";
          res.json({ success, authtoken });
        }
      }
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ success: "false", msg: "Internal Server Error" });
    }
  }
);

// Route3 : Getting userdetails. Login Required
router.post("/user", fetchuser, async (req, res) => {
  try {
    let userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json("Internal Server Error");
  }
});

module.exports = router;
