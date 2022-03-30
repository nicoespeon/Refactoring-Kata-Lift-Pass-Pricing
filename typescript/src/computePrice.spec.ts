import { expect } from "chai";
import { computePrice } from "./computePrice";
import { Repository } from "./repository";

class RepositoryUsingMemory implements Repository {
  getHolidays() {
    throw new Error("Method not implemented.");
  }

  async getBasePrice(type: string) {
    return { cost: 0 };
  }
}

describe("Compute Price", () => {
  describe("when type is night", () => {
    it("returns 0", async () => {
      const price = await computePrice(
        { type: "night", age: 0, date: "" },
        new RepositoryUsingMemory()
      );

      expect(price).to.eq(0);
    });
  });
});
