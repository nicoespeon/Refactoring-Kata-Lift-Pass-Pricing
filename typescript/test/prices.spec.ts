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

  it("does something", async () => {
    const response = await request(app).get("/prices?type=1jour");

    expect(response.body).deep.equal({ cost: 35 });
  });
});
