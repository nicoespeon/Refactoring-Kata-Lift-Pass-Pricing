import { DateTime } from "./DateTime";
import { Holiday, Repository } from "./repository";

interface PriceParameters {
  age?: number;
  type: "1jour" | "night";
  date?: string;
}

export async function computePrice(
  params: PriceParameters,
  repository: Repository
): Promise<number> {
  const result = await repository.getBasePrice(params.type);
  const holidays = await repository.getHolidays();
  const reduction = computeReduction(params, holidays);
  return applyReduction(result.cost, reduction);
}

function applyReduction(price: number, reduction: number): number {
  return Math.ceil(price * (1 - reduction / 100));
}

function computeReduction(
  { age, type, date }: PriceParameters,
  holidays: Holiday[]
): number {
  const reduction = computeDateReduction(
    holidays,
    date ? new DateTime(date) : undefined
  );

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

function computeDateReduction(holidays: Holiday[], date?: DateTime): number {
  if (!date) return 0;

  const isHoliday = holidays.some(({ holiday }) => date.isSameDay(holiday));
  return date.isMonday && !isHoliday ? 35 : 0;
}
