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

// Formatting

// "4:05p"
export const dateTimeFormat = (
  dateTime: DateTime,
  suffixMode: "service" | "wall",
): string =>
  `${dateTimeFormatNoSuffix(dateTime)}${dateTimeFormatSuffixOnly(
    dateTime,
    suffixMode,
  )}`;

// "4:05"
export const dateTimeFormatNoSuffix = (dateTime: DateTime): string => {
  const parts = dateTime.toLocaleParts(DateTime.TIME_SIMPLE);
  return parts
    .filter((x) => x.type === "hour" || x.type === "minute")
    .map((x) => x.value)
    .join(":");
};

// "p"
export const dateTimeFormatSuffixOnly = (
  dateTime: DateTime,
  suffixMode: "service" | "wall",
): "a" | "p" | "x" => {
  if (dateTime.hour >= 12) {
    return "p";
  } else if (
    suffixMode === "service" &&
    // service_date roles over at 3:45
    (dateTime.hour < 3 || (dateTime.hour === 3 && dateTime.minute < 45))
  ) {
    return "x";
  } else {
    return "a";
  }
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
