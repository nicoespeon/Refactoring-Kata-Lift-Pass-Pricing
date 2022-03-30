import express from "express";
import mysql from "mysql2/promise";
import { computePrice } from "./computePrice";
import { Repository } from "./repository";
import { createRepository } from "./repository-using-mysql";

async function createApp({ port }: { port: number } = { port: 3306 }) {
  const app = express();

  let connectionOptions = {
    host: "localhost",
    user: "root",
    database: "lift_pass",
    password: "mysql",
    port,
  };
  const connection = await mysql.createConnection(connectionOptions);

  const repository: Repository = createRepository(connection);

  app.put("/prices", async (req, res) => {
    const liftPassCost = req.query.cost;
    const liftPassType = req.query.type;
    const [rows, fields] = await connection.query(
      "INSERT INTO `base_price` (type, cost) VALUES (?, ?) " +
        "ON DUPLICATE KEY UPDATE cost = ?",
      [liftPassType, liftPassCost, liftPassCost]
    );

    res.json();
  });

  app.get("/prices", async (req, res) => {
    const cost = await computePrice(req.query, repository);

    res.json({ cost });
  });

  return { app, connection };
}

export { createApp };
