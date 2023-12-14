import { createHandler } from "../../src/handler.js";
import { expect } from "@infra-blocks/test";

describe("handler", function () {
  describe(createHandler.name, function () {
    it("should create handler", function () {
      const handler = createHandler({
        config: {
          owner: "BigMe",
          gitHubToken: "BIG_SECRET",
          templateRepository: "BigMe/BigTemplate",
        },
      });
      expect(handler).to.not.be.null;
    });
  });
});
