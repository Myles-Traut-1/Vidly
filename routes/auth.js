
const bcrypt = require("bcrypt");
const _ = require("lodash");
const express = require("express");
const { User } = require("../models/user");
const { validateRegistration, validateLogin } = require("../utils/utils");

const auth = require("../middleware/auth");

const router = express.Router();

/** ------ GET ROUTES ------*/

router.get('/me', auth, async (req, res) => {
    // THE USER_ID IS SET IN THE REQEST OBJECT INSIDE THE AUTH MIDDLEWARE.
    const userId = req.user._id;

    // NOW WE FIND THE USER OBJECT AND SEND IT TO THE CLIENT
    const user = await User.findById(userId).select("-password"); // <- dont send the password
    res.send(user);
});

/** ------ POST ROUTES ------ */

router.post('/register', async (req, res) => {
    const { error } = validateRegistration(req.body);
    if(error) {
        return res.status(400).send(error.details[0].message);
    }

    let user = await User.findOne({email: req.body.email});
    if(user) {
        return res.status(400).send("User already registered");
    }
    
    user = new User(_.pick(req.body, ["name", "email", "password"]));
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);

    user.password = hashedPassword;

    await user.save();

    const token = user.generateAuthToken();

    res.header("x-auth-token", token).send(_.pick(user, ["_id", "name", "email"]));
});

router.post('/login', async (req, res) => {
    const { error } = validateLogin(req.body);
    if(error) {
        return res.status(400).send(error.details[0].message);
    }

    let user = await User.findOne({email: req.body.email});
    if(!user) {
        return res.status(400).send("Invalid email or password");
    }

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if(!validPassword) {
        return res.status(400).send("Invalid email or password");
    }

    const token = user.generateAuthToken();
    
    res.send(token);
});

module.exports = router;