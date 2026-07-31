const bcrypt = require("bcrypt");
const _ = require("lodash");
const express = require("express");
const { User } = require("../models/user");
const { validateRegistration, validateLogin } = require("../utils/utils");

const router = express.Router();

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

    res.send(_.pick(user, ["_id", "name", "email"]));
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
    
    res.send(true);
});

module.exports = router;