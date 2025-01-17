import { dateTimeFromISO, dateTimeToISODate } from "../dateTime";
import { HeavyRailLine } from "../types";
import { DateTime } from "luxon";
import { z } from "zod";

const CERT_TYPES = ["right_of_way", "rail"];

export type Certification = {
  type: string;
  railLine: HeavyRailLine;
  expires: DateTime;
};

export type MissingCertification = Omit<Certification, "expires">;
export const MissingCertificationData = z.object({
  type: z.string(),
  rail_line: HeavyRailLine,
});
export type MissingCertificationData = z.infer<typeof MissingCertificationData>;

export const CertificationData = z.object({
  type: z.string(),
  rail_line: HeavyRailLine,
  expires: z.string(),
});
export type CertificationData = z.infer<typeof CertificationData>;

export const CertificationDataList = z.array(CertificationData);
export type CertificationDataList = z.infer<typeof CertificationDataList>;

export const certificationFromData = (cd: CertificationData): Certification => {
  const expires = dateTimeFromISO(cd.expires);
  return {
    type: cd.type,
    railLine: cd.rail_line,
    expires,
  };
};

export const certificationToData = (c: Certification): CertificationData => {
  const expires = dateTimeToISODate(c.expires);
  return {
    type: c.type,
    rail_line: c.railLine,
    expires,
  };
};

export const missingCertificationToData = (
  mc: MissingCertification,
): MissingCertificationData => {
  return {
    type: mc.type,
    rail_line: mc.railLine,
  };
};

export const isExpired = (c: Certification, now: DateTime) => {
  return now >= c.expires.startOf("day");
};

export const filterRelevantForOperators = (
  cs: Certification[],
  line: HeavyRailLine,
) => {
  return cs.filter(
    (c) =>
      (c.type === "rail" && c.railLine === line) || // Rail cert: line must match
      (c.type === "right_of_way" && [line, "none"].includes(c.railLine)), // ROW cert: must be 'none' or same line
  );
};

export const filterExpired = (
  cs: Certification[] | undefined,
  now: DateTime,
) => {
  if (cs === undefined) {
    return [];
  }
  return cs.filter((c) => isExpired(c, now));
};

export const anyOfExpired = (
  cs: Certification[] | undefined,
  now: DateTime,
) => {
  return filterExpired(cs, now).length > 0;
};

export const getMissing = (
  cs: Certification[] | undefined,
  line: HeavyRailLine,
): MissingCertification[] => {
  const stringTypesMissing =
    cs !== undefined ?
      CERT_TYPES.filter((type) => !cs.some((c) => c.type === type))
    : CERT_TYPES;

  return stringTypesMissing.map((t) => ({
    type: t,
    railLine: line,
  }));
};

export const humanReadableType = (type: string): string => {
  switch (type) {
    case "right_of_way":
      return "ROW Card";
    case "rail":
      return "Certification Card";
    default:
      return type;
  }
};
