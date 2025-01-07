import { ApiResult, useApiResult } from "../api";
import {
  Certification,
  CertificationDataList,
  certificationFromData,
  filterRelevantForOperator,
} from "../models/certification";
import { HeavyRailLine } from "../types";
import { useCallback } from "react";

const CERTIFICATIONS_API_PATH = "/api/certifications";

export const useCertifications = (
  badge: string | null,
  line: HeavyRailLine,
): ApiResult<Certification[]> => {
  const parse = useCallback(
    (data: CertificationDataList) => {
      return filterRelevantForOperator(data.map(certificationFromData), line);
    },
    [line],
  );
  return useApiResult({
    RawData: CertificationDataList,
    url: `${CERTIFICATIONS_API_PATH}?badge=${badge}`,
    parser: parse,
  });
};
