import { expect } from "chai";
import qs from "qs";
import request from "supertest-as-promised";
import { GenericContainer, StartedTestContainer } from "testcontainers";
import { createApp } from "../src/prices";

type SinglePassTestCase = {
  type: "1jour" | "night";
  age?: number | undefined;
  date?: Date | undefined;
  expectedCost: number;
};

type ManyPassesTestCase = {
  label: string;
  params: {
    type: "1jour" | "night";
    age?: number | undefined;
    date?: Date | undefined;
  }[];
  expectedCost: number;
};

describe("prices", () => {
  let app, connection, container: StartedTestContainer;

  before(async () => {
    container = await new GenericContainer("mariadb:10.4")
      .withExposedPorts(3306)
      .withEnv("MYSQL_ROOT_PASSWORD", "mysql")
      .withBindMount(`${__dirname}/database`, "/docker-entrypoint-initdb.d")
      .start();
  });

  after(function () {
    container.stop();
  });

  beforeEach(async () => {
    ({ app, connection } = await createApp({
      port: container.getMappedPort(3306),
    }));
  });

  afterEach(() => {
    connection.close();
  });

  const monday = new Date("2022-02-21T12:00:00");
  const holidayMonday = new Date("2019-02-18T12:00:00");
  const sunday = new Date("2022-02-20T12:00:00");

  describe("for a single lift pass", () => {
    describe("when type is night", () => {
      runTestCase({ type: "night", age: 14, expectedCost: 19 });
    });

    describe("when type is 1jour", () => {
      describe("when date is a monday", () => {
        runTestCase({ type: "1jour", date: monday, expectedCost: 23 });

        runTestCase({
          type: "1jour",
          age: 15,
          date: holidayMonday,
          expectedCost: 35,
        });
      });

      describe("when date is a sunday", () => {
        runTestCase({
          type: "1jour",
          age: 15,
          date: sunday,
          expectedCost: 35,
        });
      });
    });

    function runTestCase(testCase: SinglePassTestCase) {
      let description = `returns ${testCase.expectedCost}`;
      description = testCase.age
        ? `${description} - age is ${testCase.age}`
        : description;
      description = testCase.date
        ? `${description} and date is ${testCase.date}`
        : description;

      it(description, async () => {
        let pricesQuery = `/prices?type=${testCase.type}`;
        if (testCase.age) {
          pricesQuery = `${pricesQuery}&age=${testCase.age}`;
        }
        if (testCase.date) {
          pricesQuery = `${pricesQuery}&date=${testCase.date.toISOString()}`;
        }
        const response = await request(app).get(pricesQuery);

        const expectedResult = { cost: testCase.expectedCost };
        expect(response.body).deep.equal(expectedResult);
      });
    }
  });

  describe("for a group of lift passes", () => {
    describe("when type is night", () => {
      runTestCase({
        label: "two lift passes, age are 14 & 15 and type is night",
        params: [
          { type: "night", age: 14 },
          { type: "night", age: 15 },
        ],
        expectedCost: 38,
      });
    });

    function runTestCase(testCase: ManyPassesTestCase) {
      const description = `returns ${testCase.expectedCost} - ${testCase.label}`;

      it(description, async () => {
        const queryParams = qs.stringify(testCase.params);
        const pricesQuery = `/prices?${queryParams}`;

        const response = await request(app).get(pricesQuery);

        const expectedResult = { cost: testCase.expectedCost };
        expect(response.body).deep.equal(expectedResult);
      });
    }
  });
});
