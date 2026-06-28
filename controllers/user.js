const User = require("../models/user");
const crypto = require("crypto");
const VerificationToken = require("../models/verificationToken");
const { sendVerificationEmail } = require("../utils/mailer");
const bcrypt = require("bcrypt");

let newUser;
const signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!email || !username || !password) {
    return res.send("<h1> all fields are required</h1>");
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");

  try {
    const isExistingUser = await User.find({ email: email });
    if (isExistingUser.length > 0) {
      return res.json({ message: "email already used" });
    }

    const date = new Date(Date.now());
    const isoDate = date.toISOString();
    const formattedDate = isoDate.split("T")[0];

    newUser = new User({
      username,
      email,
      password,
      verified: false,
      createdAt: formattedDate,
    });
    await newUser.save();
    // Save the verification token to the database
    const token = new VerificationToken({
      userId: newUser._id, // Link the token to the newly created user
      token: verificationToken,
      createdAt: Date.now(), // Store the current timestamp
    });

    await token.save(); // Save to the database
    await sendVerificationEmail(newUser.email, verificationToken);

    // await User.create({username,email,password});
    return res.render("verificationEmailSent");
  } catch (err) {
    console.log(err);
    return res.send(
      '<h1>database error :<a href="/signup.html">clicke here to go back</a></h1>',
    );
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Admin login
    if (email === "admin" && password === "admin123") {
      req.session.user = { email, username: "admin" };
      return res.json({ location: "/admin" });
    }

    // Find user
    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.send(
        '<h1>Account not found</h1><a href="/index.html">Click here to go back</a>',
      );
    }

    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.json({
        message: "Incorrect password",
        location: "/auth.html",
      });
    }

    // Check email verification
    if (!existingUser.verified) {
      return res.json({
        message: "Please verify your email before logging in.",
        location: "/auth.html",
      });
    }

    // Create session
    req.session.user = {
      email: existingUser.email,
      username: existingUser.username,
    };

    return res.json({ location: "/" });
  } catch (err) {
    console.log(`Database error: ${err}`);
    return res.send(
      '<h1>Database error</h1><a href="/index.html">Click here to go back</a>',
    );
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.json({ message: "error logging out" });
    }
    req.session = null;
    return res.json({ message: "succesfully logged out", location: "/" });
  });
};
module.exports = { signup, login, logout, newUser };
