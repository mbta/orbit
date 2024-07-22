import { useApiResult } from "../api";
import { SignIn, SignInList } from "../models/signin";
import { HeavyRailLine } from "../types";
import { DateTime } from "luxon";

const SIGN_INS_API_PATH = "/api/signin";

const parse = (list: SignInList) =>
  list.map((si: SignIn) => ({
    ...si,
    signed_in_at: DateTime.fromISO(si.signed_in_at, {
      zone: "America/New_York",
    }),
  }));

export const useSignins = (line: HeavyRailLine) => {
  return useApiResult({
    RawData: SignInList,
    url: `${SIGN_INS_API_PATH}?line=${line}`,
    parser: parse,
  });
};
