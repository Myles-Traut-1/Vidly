const dbStartup = require("../../../db/db");
const mongoose = require("mongoose");
const config = require("config");
const logger = require("../../../utils/logger");

describe("/db", () => {
    let originalNodeEnv;

    beforeEach(() => {
        originalNodeEnv = process.env.NODE_ENV;
        jest.spyOn(mongoose, "connect").mockResolvedValue();
        jest.spyOn(logger, "info").mockImplementation(() => {});
    });

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        jest.restoreAllMocks();
    });

    it("should not connect to the db when NODE_ENV is 'test'", () => {
        process.env.NODE_ENV = "test";

        dbStartup();

        expect(mongoose.connect).not.toHaveBeenCalled();
    });
    it("should connect to the db when NODE_ENV is not 'test'", () => {
        process.env.NODE_ENV = "development";

        dbStartup();

        expect(mongoose.connect).toHaveBeenCalledWith(config.get("db"));
    });
    it("should log a message once connected", async () => {
        process.env.NODE_ENV = "development";

        dbStartup();

        // flush the mocked promise's .then()
        await Promise.resolve();

        expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Connected to"));
    });
});