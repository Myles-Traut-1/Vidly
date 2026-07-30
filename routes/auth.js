const express = require("express");
const { User } = require("../models/user");
const { validateRegistration } = require("../utils/utils");

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
    
    user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    });

    await user.save();

    res.send(user);
});

module.exports = router;