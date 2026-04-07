import type { BoostDuration } from "@/types/monetization";

export const BOOST_FIXED_VALUE = 50;
export const BOOST_HIGHLIGHT_THRESHOLD = 40;

const BOOST_WEEK_PRICE_BYN = 25;
const BOOST_MONTH_DISCOUNT = 0.8;
const BOOST_YEAR_DISCOUNT = 0.625;

export function getBoostDurationLabel(duration: BoostDuration): string {
  switch (duration) {
    case "week":
      return "Неделя";
    case "month":
      return "Месяц";
    case "year":
      return "Год";
    default:
      return duration;
  }
}

export function getBoostPriceByDuration(duration: BoostDuration): number {
  const weekPrice = BOOST_WEEK_PRICE_BYN;

  switch (duration) {
    case "week":
      return weekPrice;
    case "month":
      return Math.round(weekPrice * 4 * BOOST_MONTH_DISCOUNT * 100) / 100;
    case "year":
      return Math.round(
        weekPrice * 4 * 12 * BOOST_MONTH_DISCOUNT * BOOST_YEAR_DISCOUNT * 100,
      ) / 100;
    default:
      return weekPrice;
  }
}

export function calculateBoostExpiration(
  duration: BoostDuration,
  fromDate: Date = new Date(),
): Date {
  const date = new Date(fromDate);

  switch (duration) {
    case "week":
      date.setDate(date.getDate() + 7);
      break;
    case "month":
      date.setMonth(date.getMonth() + 1);
      break;
    case "year":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}