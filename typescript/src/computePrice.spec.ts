import { expect } from "chai";
import { computePrice } from "./computePrice";
import { Repository } from "./repository";

class RepositoryUsingMemory implements Repository {
  constructor(private basePrice = 0) {}

  getHolidays() {
    throw new Error("Method not implemented.");
  }

  async getBasePrice(type: string) {
    return { cost: this.basePrice };
  }
}

const ANY_DATE = "";

describe("Compute Price", () => {
  describe("when type is night", () => {
    it("returns 0 if age is below 6", async () => {
      const price = await computePrice(
        { type: "night", age: 5, date: ANY_DATE },
        new RepositoryUsingMemory()
      );

      expect(price).to.eq(0);
    });

    it("returns base price if age is between 6 and 64", async () => {
      const basePrice = 19;

      const price = await computePrice(
        { type: "night", age: 14, date: ANY_DATE },
        new RepositoryUsingMemory(basePrice)
      );

      expect(price).to.eq(basePrice);
    });

    it("returns 40% of the base price if age is above 64", async () => {
      const basePrice = 100;

      const price = await computePrice(
        { type: "night", age: 65, date: ANY_DATE },
        new RepositoryUsingMemory(basePrice)
      );

      expect(price).to.eq(40);
    });
  });
});
