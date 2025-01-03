import { ApiResult, useApiResult } from "../api";
import {
  Certification,
  CertificationDataList,
  certificationFromData,
} from "../models/certification";

const CERTIFICATIONS_API_PATH = "/api/certifications";

const parse = (list: CertificationDataList) => {
  return list.map(certificationFromData);
};

export const useCertifications = (
  badge: string | null,
): ApiResult<Certification[]> => {
  return useApiResult({
    RawData: CertificationDataList,
    url: `${CERTIFICATIONS_API_PATH}?badge=${badge}`,
    parser: parse,
  });
};
