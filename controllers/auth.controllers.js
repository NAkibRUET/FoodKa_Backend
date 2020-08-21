/**
 * auth.controller.js
 *
 * @module      :: Controller
 * @description :: defination of users routes action
 * @author      :: Joshim Uddin
 */

// Load User Model
const User = require("../models/User");

const {
  validateRegisterInput,
  validateLoginInput,
} = require("../validator/validator");

/**
 * @controller loginController
 * @desc check provided info, If all information is valid then generated a token.
 * @return
 */
const loginController = (req, res) => {
  const { errors, isValid, data } = validateLoginInput(req.body);

  if (!isValid) {
    return res.status(422).json({ isValid, errors: errors });
  }

  let { emailOrPhone, password } = data;

  User.findOne(
    { $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] },
    (err, user) => {
      if (!user) {
        errors.emailOrPhone =
          "The email address or phone number that you've entered doesn't match any account.";
        return res
          .status(404)
          .json({ isValid: true, isLoggedIn: false, errors: errors });
      }

      user.comparePassword(password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ success: false, errors: err });
        }

        if (!isMatch) {
          errors.password = "The password that you've entered is incorrect";
          return res
            .status(403)
            .json({ isValid: true, isLoggedIn: false, errors: errors });
        }

        user.generateToken((err, user) => {
          if (err) return res.status(400).send(err);
          res
            .cookie('w_auth', user.token)
            .status(200)
            .json({ isLoggedIn: true, token: user.token });
        });
      });
    }
  );
};

/**
 * @controller authInfoController
 * @desc
 * @return
 */
const authInfoController = (req, res) => {
  res.status(200).json({
    isAuth: true,
    isAdmin: req.user.role === 0 ? false : true,
    user: {
      name: req.user.profile.firstName + " " + req.user.profile.lastName,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      cart: req.user.cart,
      history: req.user.history,
    },
  });
};

/**
 * @controller logoutController
 * @desc
 * @return
 */
const logoutController = (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, doc) => {
    if (err) return res.json({ success: false, errors: err });
    return res.status(200).send({
      success: true,
    });
  });
};

module.exports = {
  authInfoController,
  logoutController,
  loginController,
};
