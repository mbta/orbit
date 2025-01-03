import { DateTime } from "luxon";
import { z } from "zod";

export type Certification = {
  type: string;
  railLine: string;
  expires: DateTime;
};

export const CertificationData = z.object({
  type: z.string(),
  rail_line: z.string(),
  expires: z.string(),
});
export type CertificationData = z.infer<typeof CertificationData>;

export const CertificationDataList = z.array(CertificationData);
export type CertificationDataList = z.infer<typeof CertificationDataList>;

export const certificationFromData = (cd: CertificationData): Certification => {
  return {
    type: cd.type,
    railLine: cd.rail_line,
    expires: DateTime.fromISO(cd.expires, { zone: "America/New_York" }),
  };
};

export const isExpired = (c: Certification, now: DateTime) => {
  return now >= c.expires.startOf("day");
};

export const getExpired = (cs: Certification[] | undefined, now: DateTime) => {
  if (cs === undefined) {
    return [];
  }
  return cs.filter((c) => isExpired(c, now));
};

export const anyOfExpired = (
  cs: Certification[] | undefined,
  now: DateTime,
) => {
  return getExpired(cs, now).length > 0;
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
