const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

const bcrypt = require("bcrypt");

const { User } = require("../../../models/user");

let server;
let replset;

describe("/api/auth", () => {
    let token;
    let payload;

    beforeAll(async () => {
        replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        await mongoose.connect(replset.getUri());
    });
    beforeEach(async () => {
        server = require("../../../index");

        payload = {
                    name: "new user",
                    email: "new_user@testmail.com",
                    password: "password123!"
                }
    });
    
    afterEach(async () => {
        await User.deleteMany({});
        await server.close();
    });
    afterAll(async () => {
        await mongoose.disconnect();
    });

    describe("GET /me", () => {
        let registeredUser;

        let executeRequest = () => {
            return request(server).get("/api/auth/me").set("x-auth-token", token);
        }
        beforeEach(async () => {
            let res = await request(server)
                .post("/api/auth/register")
                .send(payload);

            registeredUser = res.body;
            token = res.header["x-auth-token"];
        });

        it("should return a 200 status on successful request", async () => {
            const res = await executeRequest();
            expect(res.status).toBe(200);
        }); 
        it("should return a 401 status if not logged in", async () => {
            token = "";

            const res = await executeRequest();
            expect(res.status).toBe(401);
            expect(res.error.text).toMatch(/no token provided/i);
        }); 
        it("should return the user minus their password on successful request", async () => {
            const res = await executeRequest();
            expect(res.body).toHaveProperty("name", "new user");
            expect(res.body).toHaveProperty("email", "new_user@testmail.com");
            expect(res.body).not.toHaveProperty("password");
        }); 
    });

    describe("POST /register", () => {
        const executeRequest = () => {
            return request(server)
            .post("/api/auth/register")
            .send(payload)
        }

        it("should return 200 status on successful request", async () => {
            const res = await executeRequest();
            expect(res.status).toBe(200);
        });
        it("should return 400 status on invalid input", async () => {
            payload.name = "";

            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should return 400 status if user already registered", async () => {
            await executeRequest();

            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should add the user into the db with hashed password", async () => {
            let userInDb = await User.findOne({email: payload.email});

            expect(userInDb).toBeNull();

            await executeRequest();

            userInDb = await User.findOne({email: payload.email});

            expect(userInDb).not.toBeNull();
            expect(userInDb).toHaveProperty("name", payload.name);
            expect(userInDb).toHaveProperty("email", payload.email);

            let validPassword = await bcrypt.compare(payload.password, userInDb.password);
            expect(validPassword).toEqual(true); 
        });
        it("should set the auth token in the respone header", async () => {
            const res = await executeRequest();

            expect(res.header["x-auth-token"]).not.toBeNull();
        });
        it("should return the user without their password to the client", async () => {
            const res = await executeRequest();

            expect(res.body).toHaveProperty("name", `${payload.name}`);
            expect(res.body).toHaveProperty("email", `${payload.email}`);
            expect(res.body).not.toHaveProperty("password");
        });
    });

    describe("POST /login", () => {

        const executeRequest = () => {
            return request(server).post("/api/auth/login").send({
                email: payload.email,
                password: payload.password
            });
        }

        beforeEach(async () => {
            let registerUser = await request(server)
                .post("/api/auth/register")
                .send(payload);

            token = registerUser.header["x-auth-token"];
        });

        it("should return 200 status on successful request", async() => {
            const res = await executeRequest();

            expect(res.status).toBe(200);
        });
        it("should return 400 status on invalid email", async() => {
            payload.email = "abc";

            const res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.error.text).toMatch(/must be a valid/);
        });
        it("should return 400 status on invalid password", async() => {
            payload.password = "123";

            let res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.error.text).toMatch(/length must be at least 6 characters long/);

            payload.password = "password123";
            res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.error.text).toMatch(/Invalid email or password/);
        });
        it("should return 400 status on invalid email", async() => {
            payload.email = "user@testmail.com";

            const res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.error.text).toMatch(/Invalid email or password/);
        });
        it("should send the auth token to the client", async() => {
            const res = await executeRequest();

            expect(res.body.token).not.toBeNull();
        });
    });
});