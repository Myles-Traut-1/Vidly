const checkJwtPk = require("../../../config/config");
const config = require("config");

describe("config/config", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should throw an error if jwtPrivateKey is not set", () => {
        jest.spyOn(config, "get").mockReturnValue(undefined);

        expect(() => checkJwtPk()).toThrow("FATAL ERROR... jwtPrivateKey not set");
    });
    it("should not throw an error if jwtPrivateKey is set", () => {
        jest.spyOn(config, "get").mockReturnValue("superSecretKey");

        expect(() => checkJwtPk()).not.toThrow();
    });
});