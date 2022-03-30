export interface Repository {
  getHolidays(): Promise<Holiday[]>;
  getBasePrice(type: string): Promise<{ cost: number }>;
}

export interface Holiday {
  holiday: Date;
}
