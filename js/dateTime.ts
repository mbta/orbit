import { getNow } from "./now";
import { DateTime, Settings as LuxonSettings } from "luxon";
import { useEffect, useState } from "react";

// eslint-disable-next-line better-mutation/no-mutation
LuxonSettings.throwOnInvalid = true;

export const dateTimeFromISO = (isoDateTime: string): DateTime =>
  DateTime.fromISO(isoDateTime, { zone: "America/New_York" });

export const dateTimeFromUnix = (unixSeconds: number): DateTime =>
  DateTime.fromSeconds(unixSeconds, { zone: "America/New_York" });

export const dateTimeToISODate = (dt: DateTime<true>): string => dt.toISODate();

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
