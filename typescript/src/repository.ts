export interface Repository {
  getHolidays();
  getBasePrice(type: string): Promise<{ cost: number }>;
}
