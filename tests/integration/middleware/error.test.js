const { Genre } = require("../../../models/genre");

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

let server;
let replset;

describe("Error Middleware", () => {
    beforeAll(async () => {
        replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        await mongoose.connect(replset.getUri());
    });
    
    beforeEach(async () => {
        server = require("../../../index");
    });

    afterEach(async () => {
        await server.close();
        await Genre.deleteMany({});
        jest.restoreAllMocks();
    });

    afterAll(async () => {
        await mongoose.disconnect();
    });

    const executeRequest = () => {
        return request(server).get("/api/genres");
    }

    it("should", async() => {
        console.log("working");
    })

    it("should return 500 status when a route handler throws", async() => {
        jest.spyOn(Genre, "find").mockImplementation(() => {
            throw new Error("DB Failure");
        });

        const res = await executeRequest();

        expect(res.status).toBe(500);
        expect(res.text).toMatch(/An error occured fetching data.../i);
    });

});