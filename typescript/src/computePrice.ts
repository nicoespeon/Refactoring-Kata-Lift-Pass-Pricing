import { Holiday, Repository } from "./repository";

interface PriceParameters {
  age?: number;
  type: "1jour" | "night";
  date: string;
}

export async function computePrice(
  params: PriceParameters,
  repository: Repository
): Promise<number> {
  const result = await repository.getBasePrice(params.type);
  const holidays = await repository.getHolidays();
  const reduction = computeReduction(params, holidays);
  return Math.ceil(reducePrice(result.cost, reduction));
}

function reducePrice(price: number, reduction: number): number {
  return price * (1 - reduction / 100);
}

function computeReduction(
  { age, type, date }: PriceParameters,
  holidays: Holiday[]
): number {
  const reduction = computeDateReduction(holidays, date);

  if (age === undefined) {
    return type === "night" ? 100 : reduction;
  }

  if (age < 6) {
    return 100;
  }

  if (type === "night") {
    return age > 64 ? 60 : 0;
  }

  // TODO apply reduction for others
  if (age < 15) {
    return 30;
  }

  if (age > 64) {
    return reduction + 25;
  }

  return reduction;
}

function computeDateReduction(holidays: Holiday[], date: string): number {
  let isHoliday = false;
  for (let row of holidays) {
    const holiday = row.holiday;
    if (date) {
      const d = new Date(date);
      if (
        d.getFullYear() === holiday.getFullYear() &&
        d.getMonth() === holiday.getMonth() &&
        d.getDate() === holiday.getDate()
      ) {
        isHoliday = true;
      }
    }
  }

  const isMonday = new Date(date).getDay() === 1;

  return !isHoliday && isMonday ? 35 : 0;
}
