import { getNow } from "./now";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";

export const daysBetween = (now: DateTime, date: DateTime) => {
  return date.diff(now, "days").days;
};

export const useNow = (unit: "minute" | "second"): DateTime => {
  const [dateTime, setDateTime] = useState<DateTime>(getNow);
  useEffect(() => {
    const now = dateTime;
    const next = now.startOf(unit).plus({ [unit]: 1 });
    const timeout = setTimeout(() => {
      setDateTime(getNow);
    }, next.diff(now).valueOf());
    return () => {
      clearTimeout(timeout);
    };
  }, [dateTime, unit]);

  return dateTime;
};
