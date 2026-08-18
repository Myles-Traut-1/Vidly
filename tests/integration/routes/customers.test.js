const mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

const express = require("express");
const request = require("supertest");

const { Customer } = require("../../../models/customer");
const { User } = require("../../../models/user");

let server;
let replset;

describe("/api/customers/", () => {
    let customer;
    let customerId;
    let customerName;
    let customerPhone;
    let customerIsGold;

    beforeAll(async () => {
        replset = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
        await mongoose.connect(replset.getUri());
    });
    beforeEach(async () => {
        server = require("../../../index");
        
        customerId = new mongoose.Types.ObjectId();
        customerName = "New Customer";
        customerPhone = "1234567890",
        customerIsGold = true;

        customer = new Customer({
            _id : customerId,
            name: customerName,
            phone: customerPhone,
            isGold: customerIsGold
        });

        await customer.save();
    });

    afterEach(async () => {
        await server.close();
        await  Customer.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await replset.stop();

    });

    describe("GET /", () => {
        const newCustomer1 = new Customer({
            name: "New Customer 1",
            phone: "xxxxxxxxxxx",
            isGold: true
        });
        const newCustomer2 = new Customer({
            name: "New Customer 2",
            phone: "xxxxxxxxxxy",
            isGold: false
        });

        const executeRequest = () => {
            return request(server).get("/api/customers");
        }

        it("should return an array of customers", async() => {
            await Customer.collection.insertMany([newCustomer1, newCustomer2]);

            const res = await executeRequest();

            expect(res.body.length).toEqual(3);
            expect(res.body.some(c => c.name === "New Customer")).toBeTruthy();
            expect(res.body.some(c => c.name === "New Customer 1")).toBeTruthy();
            expect(res.body.some(c => c.name === "New Customer 2")).toBeTruthy();
        });
    });
    describe("GET /:id", () => {
        
        const executeRequest = () => {
            return request(server).get(`/api/customers/${customerId}`);
        }

        it("should return a 400 status on invalid id", async() => {
            customerId = "1"

            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should return a 404 status if no customer found", async() => {
            customerId = new mongoose.Types.ObjectId().toHexString();

            const res = await executeRequest();
            expect(res.status).toBe(404);
        });
        it("should return a 200 status for valid request", async() => {
            const res = await executeRequest();
            expect(res.status).toBe(200);
        });
        it("should return the correct customer", async() => {
            const res = await executeRequest();
            expect(res.body).toHaveProperty("name", "New Customer");
        });
    });
    describe("POST /", () => {
        let token;
        let user;

        let newCustomerName;
        let newCustomerPhone;

        const executeRequest = () => {
            return request(server)
            .post("/api/customers")
            .set("x-auth-token", token)
            .send({
                name: newCustomerName,
                phone: newCustomerPhone,
                isGold: false
            });
        }

        beforeEach(async() => {
            user = {_id: new mongoose.Types.ObjectId(), isAdmin: true };
            token = new User(user).generateAuthToken();

            newCustomerName = "Alice";
            newCustomerPhone = "xxxxxxxxxx";
        });

        it("should return 200 status on successful request", async () => {
            const res = await executeRequest();
            expect(res.status).toBe(200);
        });
        it("should return 400 status on invalid request", async () => {
            newCustomerName = "";

            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should return 401 status if not logged in", async () => {
            token = "";

            const res = await executeRequest();
            expect(res.status).toBe(401);
        });
        it("should add the customer to the db on valid request", async () => {
            await executeRequest();

            const customerInDb = await Customer.findOne({name: newCustomerName});
            expect(customerInDb.name).toEqual(newCustomerName);
            expect(customerInDb.phone).toEqual(newCustomerPhone);
            expect(customerInDb.isGold).toBeFalsy();
        });
        it("should return the new customer in the response", async () => {
            const res = await executeRequest();

            expect(res.body.name).toEqual(newCustomerName);
            expect(res.body.phone).toEqual(newCustomerPhone);
            expect(res.body.isGold).toEqual(false);
        });
    });
    describe("PUT /:id", () => {
        let token;
        let updatedCustomerPhone;

        const executeRequest = () => {
            return request(server)
            .put(`/api/customers/${customerId}`)
            .set("x-auth-token", token)
            .send({
                name: "New Customer",
                phone: updatedCustomerPhone,
                isGold: true
            });
        }

        beforeEach(async() => {
            token = new User().generateAuthToken();
            updatedCustomerPhone = "yyyyyyyyyy";
            customerId = customer._id;
        });

        it("should return 200 status on sucessful request", async() => {
            const res = await executeRequest();
            expect(res.status).toBe(200);
        });
        it("should return 400 status if invalid input", async () => {
            updatedCustomerPhone = "";

            const res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.error.text).toMatch(/not allowed to be empty/i);
        });
        it("should return 400 status if invalid objectId", async () => {
            customerId = "1";
            const res = await executeRequest();

            expect(res.status).toBe(400);
            expect(res.error.text).toMatch(/invalid id/i)
        });
        it("should return 401 status if not logged in", async () => {
            token = "";
            const res = await executeRequest();
            expect(res.status).toBe(401);
            expect(res.error.text).toMatch(/Access denied/i);
        });
        it("should return 404 status if customer not found", async () => {
            customerId = new mongoose.Types.ObjectId();

            const res = await executeRequest();

            expect(res.status).toBe(404);
            expect(res.error.text).toMatch(/not found/i);
        });
        it("should update the customer in the db on a valid input", async () => {
            const res = await executeRequest();
            
            let customerInDb = await Customer.findById(customerId);

            expect(customerInDb.phone).toBe(updatedCustomerPhone);
            expect(customerInDb.name).toEqual("New Customer");
            expect(customerInDb.isGold).toEqual(true);
        });
        it("should return the updated customer in the response", async () => {
            const res = await executeRequest();

            expect(res.body.name).toMatch("New Customer");
            expect(res.body.phone).toMatch(updatedCustomerPhone);
            expect(res.body.isGold).toBeTruthy();   
        });
    });
    describe("DELETE /:id", () => {
        let token;
        let user;
        let customerId;

        const executeRequest = () => {
            return request(server)
            .delete(`/api/customers/${customerId}`)
            .set("x-auth-token", token);
        }

        beforeEach(async () => {
            user = {_id: new mongoose.Types.ObjectId(), isAdmin: true};
            token = new User(user).generateAuthToken();
            customerId = customer._id;
        });

        it("should return 200 response for successful request", async() => {
            const res = await executeRequest();
            expect(res.status).toBe(200);
        });
        it("should return 400 status on invalid id", async () => {
            customerId = "1";
            
            const res = await executeRequest();
            expect(res.status).toBe(400);
        });
        it("should return 401 status if not logged in", async () => {
            token = "";
            
            const res = await executeRequest();
            expect(res.status).toBe(401);
        });
        it("should return 403 status if not admin", async () => {
            user = {_id: new mongoose.Types.ObjectId(), isAdmin: false};
            token = new User(user).generateAuthToken();
            
            const res = await executeRequest();
            expect(res.status).toBe(403);
        });
        it("should return 404 status if movie not found", async () => {
            await Customer.deleteMany({});
            
            const res = await executeRequest();
            
            expect(res.status).toBe(404);
        });
        it("should delete the customer from the db on valid input", async () => {
            const res = await executeRequest();

            const deletedCustomer = await Customer.findById(customerId);
            
            expect(deletedCustomer).toBe(null);
        });
        it("should return the deleted customer in the response", async () => {
            const res = await executeRequest();
    
            expect(Object.keys(res.body))
                .toEqual(expect.arrayContaining(["name", "phone", "isGold"]));
        });
    });
});