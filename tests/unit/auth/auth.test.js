const { User } = require("../../../models/user");
const jwt = require("jsonwebtoken");
const config = require("config");
const mongoose = require("mongoose");
const auth = require("../../../middleware/auth");

describe("JWT Validation", () => {
    it("returns a valid jwt token", () => {
        const payload = {_id: new mongoose.Types.ObjectId().toHexString(), isAdmin: true}
        const user = new User(payload);

        const token = user.generateAuthToken();

        const decoded = jwt.verify(token, config.get("jwtPrivateKey"));

        expect(decoded).toMatchObject(payload);
    });
});

describe("Auth Middleware", () => {
    it("should populate the req.body with a valid user object", () => {
        const user = {
            _id: new mongoose.Types.ObjectId().toHexString(), 
            isAdmin: true
        }

        const token = new User(user).generateAuthToken();

        let req = {
            header: jest.fn().mockReturnValue(token)
        }
        let res = {}
        let next = jest.fn();

        auth(req, res, next);

        expect(req.user).toMatchObject(user);
    });
});