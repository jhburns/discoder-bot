import { strict as assert } from 'assert';
import helpers from "../utils/helpers.js";

describe("Helpers", () => {
  describe("extractCode()", () => {
    it("should extract code from single backticks", () => {
      const text = "`example`";

      assert(helpers.extractCode(text), "example");
    });
  });
});

describe("Helpers", () => {
  describe("extractCode()", () => {
    it("should throw if there are no backticks", () => {
      const text = "example";

      assert.throws(() => helpers.extractCode(text));
    });
  });
});

describe("Helpers", () => {
  describe("extractCode()", () => {
    it("should throw if there is no ending single backtick", () => {
      const text = "`example";

      assert.throws(() => helpers.extractCode(text));
    });
  });
});

describe("Helpers", () => {
  describe("extractCode()", () => {
    it("should extract code from triple backticks", () => {
      const text = "```example```";

      assert(helpers.extractCode(text), "example");
    });
  });
});

describe("Helpers", () => {
  describe("extractCode()", () => {
    it("should throw if there is no ending triple backticks", () => {
      const text = "```example";

      assert.throws(() => helpers.extractCode(text));
    });
  });
});

describe("Helpers", () => {
  describe("extractCode()", () => {
    it("should remove language highlighting", () => {
      const text = "```scheme\n" +
        "example```";

      assert(helpers.extractCode(text), "example");
    });
  });
});

describe("Helpers", () => {
  describe("extractCode()", () => {
    it("should not remove language if there is whitespace after it", () => {
      const text = "```scheme\n " +
        "example```";

      assert(helpers.extractCode(text), "scheme\n example");
    });
  });
});

describe("Helpers", () => {
  describe("extractCode()", () => {
    it("should not remove language if the rest of the block is empty", () => {
      const text = "```scheme\n " +
        "```";

      assert(helpers.extractCode(text), "scheme\n ");
    });
  });
});

describe("Helpers", () => {
  describe("extractCode()", () => {
    it("should not remove language if illegal characters are used", () => {
      const text = "```S0$\n " +
        "example```";

      assert(helpers.extractCode(text), "S0$\n example");
    });
  });
});