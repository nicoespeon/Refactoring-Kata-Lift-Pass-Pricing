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

  it("should return 0 when age is less than 6", async () => {
    const query = { type: "1jour", age: 5 };

    const response = await request(app).get("/prices").query(query);

    expect(response.body).to.have.property("cost", 0);
  });

  it("should return day cost when type is '1jour'", async () => {
    const query = { type: "1jour" };

    const response = await request(app).get("/prices").query(query);

    expect(response.body).to.have.property("cost", 35);
  });

  it("should return 70% of day cost when age is less than 15", async () => {
    const req = { type: "1jour", age: 14 };

    const response = await request(app).get("/prices").query(req);

    expect(response.body).to.have.property("cost", 25);
  });

  it("should return 75% of day cost when age is more than 64", async () => {
    const req = { type: "1jour", age: 65 };

    const response = await request(app).get("/prices").query(req);

    expect(response.body).to.have.property("cost", 27);
  });

  it("should return night cost when type is 'night' and age is more than 6", async () => {
    const req = { type: "night", age: 7 };

    const response = await request(app).get("/prices").query(req);

    expect(response.body).to.have.property("cost", 19);
  });

  it("should return 40% of night cost when type is 'night' and age is more than 64", async () => {
    const req = { type: "night", age: 65 };

    const response = await request(app).get("/prices").query(req);

    expect(response.body).to.have.property("cost", 8);
  });

  it("should return day cost with 35% reduction when date is Monday", async () => {
    const req = { type: "1jour", age: 15, date: "2020-01-06T06:00:00Z" };

    const response = await request(app).get("/prices").query(req);

    expect(response.body).to.have.property("cost", 23);
  });

  it("should return day cost when date is Holiday", async () => {
    const req = { type: "1jour", age: 15, date: "2019-02-18" };

    const response = await request(app).get("/prices").query(req);

    expect(response.body).to.have.property("cost", 35);
  });
});
