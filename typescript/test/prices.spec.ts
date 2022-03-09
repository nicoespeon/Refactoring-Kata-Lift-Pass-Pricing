import { assert, expect } from "chai";
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

  after(function () {
    container.stop();
  });

  beforeEach(async () => {
    ({ app, connection } = await createApp());
  });

  afterEach(() => {
    connection.close();
  });

  it("returns 35 for 1jour", async () => {
    const response = await request(app).get("/prices?type=1jour");

    const expectedResult = { cost: 35 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 0 for night", async () => {
    const response = await request(app).get("/prices?type=night");

    const expectedResult = { cost: 0 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 19 for night and age is 14", async () => {
    const response = await request(app).get("/prices?type=night&age=14");

    const expectedResult = { cost: 19 };

    expect(response.body).deep.equal(expectedResult);
  });

  it("returns 8 for night and age is 65", async () => {
    const response = await request(app).get("/prices?type=night&age=65");

    const expectedResult = { cost: 8 };

    expect(response.body).deep.equal(expectedResult);
  });
});
