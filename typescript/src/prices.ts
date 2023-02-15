import express from "express";
import mysql from "mysql2/promise";

async function createApp() {
  const app = express();

  let connectionOptions = {
    host: "localhost",
    user: "root",
    database: "lift_pass",
    password: "mysql",
  };
  const connection = await mysql.createConnection(connectionOptions);

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
    const { type, age, date } = req.query;
    const repository = new RepositoryUsingMySQL(connection);

    const cost = await computePrice(repository, { type, age, date });

    res.json({ cost });
  });

  return { app, connection };
}

interface Repository {
  getBasePrice(type: string): Promise<any>;
  getHolidays(): Promise<any>;
}

class RepositoryUsingMySQL implements Repository {
  constructor(private connection: any) {}

  async getBasePrice(type: string): Promise<any> {
    return (
      await this.connection.query(
        "SELECT cost FROM `base_price` " + "WHERE `type` = ? ",
        [type]
      )
    )[0][0];
  }

  async getHolidays(): Promise<any> {
    return (await this.connection.query("SELECT * FROM `holidays`"))[0];
  }
}

async function computePrice(
  repository: RepositoryUsingMySQL,
  { type, age, date }: { type: any; age: any; date: any }
) {
  const basePrice = await repository.getBasePrice(type);
  let cost = 0;
  let reduction = 0;

  if (age < 6) {
    return 0;
  }

  if (type === "night") {
    if (age > 64) {
      return Math.ceil(basePrice.cost * 0.4);
    }
    return basePrice.cost;
  }

  const holidays = await repository.getHolidays();
  let isHoliday;
  for (let row of holidays) {
    let holiday = row.holiday;
    if (date) {
      let d = new Date(date);
      if (
        d.getFullYear() === holiday.getFullYear() &&
        d.getMonth() === holiday.getMonth() &&
        d.getDate() === holiday.getDate()
      ) {
        isHoliday = true;
      }
    }
  }

  if (!isHoliday && new Date(date).getDay() === 1) {
    reduction = 35;
  }

  // TODO apply reduction for others
  if (age < 15) {
    cost = Math.ceil(basePrice.cost * 0.7);
  } else if (age > 64) {
    cost = Math.ceil(basePrice.cost * 0.75 * (1 - reduction / 100));
  } else {
    cost = Math.ceil(basePrice.cost * (1 - reduction / 100));
  }

  return cost;
}

export { createApp };
