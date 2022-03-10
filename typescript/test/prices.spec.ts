import { assert, expect } from "chai";
import request from "supertest-as-promised";
import { GenericContainer, StartedTestContainer } from "testcontainers";
import { createApp } from "../src/prices";

type TestCase = {
  type: '1jour' | 'night',
  age?: number | undefined,
  date?: Date | undefined,
  expectedCost: number,
}

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
    ({ app, connection } = await createApp({ port: container.getMappedPort(3306) }));
  });

  afterEach(() => {
    connection.close();
  });


  describe('when type is night', () => {
    const nightTestCases: TestCase[] = [
      { type: 'night', expectedCost: 0 },
      { type: 'night', expectedCost: 19, age: 14 },
      { type: 'night', expectedCost: 8, age: 65 },
      { type: 'night', expectedCost: 0, age: 5 },
    ];
    runTestCases(nightTestCases);
  });

  describe('when type is 1jour', () => {
    const dayTestCases: TestCase[] = [
      { type: '1jour', expectedCost: 35 },
      { type: '1jour', expectedCost: 25, age: 14 },
      { type: '1jour', expectedCost: 27, age: 65 },
      { type: '1jour', expectedCost: 35, age: 64 },
      { type: '1jour', expectedCost: 35, age: 15 },
    ];
    runTestCases(dayTestCases);

    const monday1 = new Date('2022-02-21T12:00:00');
    const monday2 = new Date('2022-02-21T12:00:00');
    const holidayMonday1 = new Date('2019-02-18T12:00:00');
    const holidayMonday2 = new Date('2019-02-25T12:00:00');
    const holidayMonday3 = new Date('2019-03-04T12:00:00');

    describe('when date is a monday', () => {
      const mondayTestCases: TestCase[] = [
        { type: '1jour', expectedCost: 23, age: 15, date: monday1 },
        { type: '1jour', expectedCost: 23, age: 15, date: monday2 },
        { type: '1jour', expectedCost: 35, age: 15, date: holidayMonday1 },
        { type: '1jour', expectedCost: 35, age: 15, date: holidayMonday2 },
        { type: '1jour', expectedCost: 35, age: 15, date: holidayMonday3 },
      ];
      runTestCases(mondayTestCases);
    })

    const sunday = new Date('2022-02-20T12:00:00');
    describe('when date is a sunday', () => {
      const sundayTestCase: TestCase = { type: '1jour', expectedCost: 35, age: 15, date: sunday };
      runTestCase(sundayTestCase);
    });
  });

  function runTestCases(testCases: TestCase[]) {
    for (const testCase of testCases) {
      runTestCase(testCase);
    }
  }

  function runTestCase(testCase: TestCase) {
    let description = `returns ${testCase.expectedCost}`;
    description = testCase.age ? `${description} - age is ${testCase.age}` : description;
    description = testCase.date ? `${description} and date is ${testCase.date}` : description;

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
