import { expect } from "chai";
import { computePrice } from "./computePrice";
import { Repository, Holiday } from "./repository";

class RepositoryUsingMemory implements Repository {
  constructor(
    private basePrices: Partial<{ night: number; "1jour": number }> = {},
    private holidays: string[] = []
  ) {}

  async getHolidays() {
    return this.holidays.map(holiday => ({ holiday: new Date(holiday) }));
  }

  async getBasePrice(type: string) {
    return { cost: this.basePrices[type] || 0 };
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
        new RepositoryUsingMemory({ night: basePrice })
      );

      expect(price).to.eq(basePrice);
    });

    it("returns 40% of the base price if age is above 64", async () => {
      const basePrice = 100;

      const price = await computePrice(
        { type: "night", age: 65, date: ANY_DATE },
        new RepositoryUsingMemory({ night: basePrice })
      );

      expect(price).to.eq(40);
    });
  });

  describe("when type is 1jour", () => {
    it("returns 0 if age is below 6", async () => {
      const price = await computePrice(
        { type: "1jour", age: 5, date: ANY_DATE },
        new RepositoryUsingMemory()
      );

      expect(price).to.eq(0);
    });

    it("returns 70% of base price if age is between 6 and 14", async () => {
      const basePrice = 100;

      const price = await computePrice(
        { type: "1jour", age: 14, date: ANY_DATE },
        new RepositoryUsingMemory({ "1jour": basePrice })
      );

      expect(price).to.eq(70);
    });

    it("returns base price if age is between 15 and 64", async () => {
      const basePrice = 100;

      const price = await computePrice(
        { type: "1jour", age: 15, date: ANY_DATE },
        new RepositoryUsingMemory({ "1jour": basePrice })
      );

      expect(price).to.eq(basePrice);
    });

    it("returns 75% of base price if age is above 65", async () => {
      const basePrice = 100;

      const price = await computePrice(
        { type: "1jour", age: 65, date: ANY_DATE },
        new RepositoryUsingMemory({ "1jour": basePrice })
      );

      expect(price).to.eq(75);
    });

    describe("when day is a Monday out of holiday", () => {
      it("returns 65% of base price for any given age", async () => {
        const MONDAY = "2022-02-21T12:00:00";
        const basePrice = 100;

        const price = await computePrice(
          { type: "1jour", age: undefined, date: MONDAY },
          new RepositoryUsingMemory({ "1jour": basePrice })
        );

        expect(price).to.eq(65);
      });
    });

    describe("when day is a Monday of holiday", () => {
      it("returns 100% of base price for any given age", async () => {
        const MONDAY = "2022-02-21T12:00:00";
        const basePrice = 100;

        const price = await computePrice(
          { type: "1jour", age: undefined, date: MONDAY },
          new RepositoryUsingMemory({ "1jour": basePrice }, [MONDAY])
        );

        expect(price).to.eq(100);
      });
    })
  });
});
