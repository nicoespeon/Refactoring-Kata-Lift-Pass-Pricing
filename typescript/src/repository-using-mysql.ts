import { Repository } from "./repository";

export function createRepository(connection: any) {
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
