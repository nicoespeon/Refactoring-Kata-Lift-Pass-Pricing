import { expect } from "chai";
import request from "supertest-as-promised";
import { GenericContainer, StartedTestContainer } from "testcontainers";
import { createApp } from "../src/prices";

describe("prices", () => {
  let app, connection, container: StartedTestContainer;

  before(async () => {
    container = await new GenericContainer("mariadb:10.4")
      .withExposedPorts({ container: 3306, host: 3306 })
      .withEnv("MYSQL_ROOT_PASSWORD", "mysql")
      .withBindMount(`${__dirname}/database`, "/docker-entrypoint-initdb.d")
      .start();
  });

  after(() => {
    container.stop();
  });

  beforeEach(async () => {
    ({ app, connection } = await createApp());
  });

  afterEach(() => {
    connection.close();
  });

  it("returns 0 for night and age is 5", async () => {
    const response = await request(app).get("/prices?type=night&age=5");

    const expectedResult = { cost: 0 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 8 for 1jour and age is 14", async () => {
    const response = await request(app).get("/prices?type=1jour&age=14");

    const expectedResult = { cost: 25 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 27 for 1jour and age is 65", async () => {
    const response = await request(app).get("/prices?type=1jour&age=65");

    const expectedResult = { cost: 27 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 35 for 1jour and age is 64", async () => {
    const response = await request(app).get("/prices?type=1jour&age=64");

    const expectedResult = { cost: 35 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 35 for 1jour and age is 15", async () => {
    const response = await request(app).get("/prices?type=1jour&age=15");

    const expectedResult = { cost: 35 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 23 for 1jour and age is 15 on 2022-02-22", async () => {
    const response = await request(app).get(
      "/prices?type=1jour&age=15&date=2022-02-22"
    );

    const expectedResult = { cost: 23 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 23 for 1jour and age is 15 on 2022-02-29", async () => {
    const response = await request(app).get(
      "/prices?type=1jour&age=15&date=2022-02-29"
    );

    const expectedResult = { cost: 23 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 35 for 1jour and age is 15 on 2022-02-28", async () => {
    const response = await request(app).get(
      "/prices?type=1jour&age=15&date=2022-02-28"
    );

    const expectedResult = { cost: 35 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 35 for 1jour and age is 15 on 2019-02-18", async () => {
    const response = await request(app).get(
      "/prices?type=1jour&age=15&date=2019-02-18T05:00:00.000Z"
    );

    const expectedResult = { cost: 35 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 35 for 1jour and age is 15 on 2019-02-25", async () => {
    const response = await request(app).get(
      "/prices?type=1jour&age=15&date=2019-02-25T05:00:00.000Z"
    );

    const expectedResult = { cost: 35 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 23 for 1jour and age is 15 on 2019-02-04", async () => {
    const response = await request(app).get(
      "/prices?type=1jour&age=15&date=2019-02-04T05:00:00.000Z"
    );

    const expectedResult = { cost: 23 };

    expect(response.body).deep.equal(expectedResult);
  });
});
