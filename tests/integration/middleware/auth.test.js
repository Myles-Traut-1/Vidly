const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

const { User } = require("../../../models/user");
const { Genre } = require("../../../models/genre");

let server;
let replset;

describe("Auth Middleware", () => {
    beforeAll(async () => {
        replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        await mongoose.connect(replset.getUri());
    });

    beforeEach(async () => {
        server = require("../../../index");
        token = new User().generateAuthToken();
    });
    
    afterEach(async () => {
        await Genre.deleteMany({});
        await server.close();
    });
    afterAll(async () => {
        await mongoose.disconnect();
    });
    
    let token;

    const executeRequest = () => {
        return request(server).post("/api/genres").set("x-auth-token", token).send({name: "Genre1"});
    }

    it("should return a 401 status when no token is provided", async () => {
        token = "";

        const res = await executeRequest();

        expect(res.status).toBe(401);
    });
    it("should return a 400 status when invalid token is provided", async () => {
        token = "a";

        const res = await executeRequest();

        expect(res.status).toBe(400);
    });
    it("should return a 200 status when a valid token is provided", async () => {
        const res = await executeRequest();

        expect(res.status).toBe(200);
    });
});