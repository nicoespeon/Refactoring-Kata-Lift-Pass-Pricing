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
  if (age < 6) return 0;

  const { cost } = await repository.getBasePrice(type);

  if (type === "night") {
    return age > 64 ? Math.ceil(cost * 0.4) : cost;
  }

  const reduction = await computeReduction(repository, date);

  // TODO apply reduction for others
  if (age < 15) {
    return Math.ceil(cost * 0.7);
  }

  if (age > 64) {
    return Math.ceil(cost * 0.75 * (1 - reduction / 100));
  }

  return Math.ceil(cost * (1 - reduction / 100));
}

async function computeReduction(repository: Repository, date: any) {
  const isHoliday = await isDateHoliday(repository, date);
  const isMonday = new Date(date).getDay() === 1;

  return !isHoliday && isMonday ? 35 : 0;
}

async function isDateHoliday(repository: Repository, date: any) {
  const holidays = await repository.getHolidays();

  for (let row of holidays) {
    let holiday = row.holiday;
    if (!date) continue;

    let d = new Date(date);
    const isSameDate =
      d.getFullYear() === holiday.getFullYear() &&
      d.getMonth() === holiday.getMonth() &&
      d.getDate() === holiday.getDate();

    if (isSameDate) return true;
  }

  return false;
}

export { createApp };
