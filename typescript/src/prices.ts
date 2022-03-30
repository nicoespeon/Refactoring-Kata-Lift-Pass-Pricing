import express from "express";
import mysql from "mysql2/promise";

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

async function computePrice(
  { age, type, date }: { age: number; type: "1jour" | "night"; date: string },
  repository: Repository
) {
  const result = await repository.getBasePrice(type);

  let { cost } = result;

  if (age < 6) {
    cost = 0;
  } else {
    if (type !== "night") {
      const holidays = await repository.getHolidays();

      let isHoliday;
      let reduction = 0;
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
        cost = Math.ceil(result.cost * 0.7);
      } else {
        if (age === undefined) {
          cost = Math.ceil(result.cost * (1 - reduction / 100));
        } else {
          if (age > 64) {
            cost = Math.ceil(result.cost * 0.75 * (1 - reduction / 100));
          } else {
            cost = Math.ceil(result.cost * (1 - reduction / 100));
          }
        }
      }
    } else {
      if (age >= 6) {
        if (age > 64) {
          cost = Math.ceil(result.cost * 0.4);
        }
      } else {
        cost = 0;
      }
    }
  }
  return cost;
}

function createRepository(connection: any) {
  return new RepositoryUsingMySQL(connection);
}

class RepositoryUsingMySQL implements Repository {
  constructor(private readonly connection) {}

  async getHolidays() {
    const result = await this.connection.query("SELECT * FROM `holidays`");
    return result[0];
  }

  async getBasePrice(type: string) {
    const result = await this.connection.query(
      "SELECT cost FROM `base_price` " + "WHERE `type` = ? ",
      [type]
    );
    return result[0][0];
  }
}

interface Repository {
  getHolidays();
  getBasePrice(type: string);
}

export { createApp };
