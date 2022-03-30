import { Repository } from "./repository";

export async function computePrice(
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
