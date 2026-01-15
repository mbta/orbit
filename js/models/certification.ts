import { dateTimeFromISO, dateTimeToISODate, daysBetween } from "../dateTime";
import { HeavyRailLine } from "../types";
import { DateTime } from "luxon";
import { z } from "zod";

// we no longer check ROW certs
// asana task: https://app.asana.com/1/15492006741476/project/1200273269966439/task/1212407153023881
const CERT_TYPES = ["rail"];
const WARN_WITHIN_D = 60;

export type Certification = {
  type: string;
  railLine: HeavyRailLine;
  expires: DateTime;
};

/**
 * MissingCertification(s) aren't sent by the server; they're computed
 *  here on the frontend and are included in the sign-in's override
 *  payload if needed
 */
export type MissingCertification = Omit<Certification, "expires">;
export const MissingCertificationData = z.object({
  type: z.string(),
  rail_line: HeavyRailLine,
});
export type MissingCertificationData = z.infer<typeof MissingCertificationData>;

export type CertificationStatus = {
  active: Certification[];
  expired: Certification[];
  missing: MissingCertification[];
};

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
  return cs.filter((c) => c.type === "rail" && c.railLine === line);
};

export const filterExpiresSoon = (
  cs: Certification[],
  now: DateTime,
): Certification[] => {
  return cs.filter((cert) => {
    return daysBetween(now, cert.expires) <= WARN_WITHIN_D;
  });
};

export const getStatus = (
  cs: Certification[],
  now: DateTime,
  line: HeavyRailLine,
): CertificationStatus => {
  return {
    active: cs.filter((c) => !isExpired(c, now)),
    expired: cs.filter((c) => isExpired(c, now)),
    missing: getMissing(cs, line),
  };
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
