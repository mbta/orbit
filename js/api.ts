import { fetch } from "./browser";
import { useEffect, useState } from "react";
import { z } from "zod";

export type ApiResponse<OkResult, ErrorResult = never> =
  | { status: "ok"; result: OkResult }
  | {
      status: "error";
      statusCode?: number;
      result?: ErrorResult;
    };

export type ApiResult<OkResult, ErrorResult = never> =
  | { status: "loading" }
  | ApiResponse<OkResult, ErrorResult>;

export const useApiResult = <RawData, Data>({
  RawData,
  url,
  parser,
}: {
  RawData: z.ZodType<RawData>;
  url: string;
  parser: (data: RawData) => Data;
}): ApiResult<Data> => {
  const [result, setResult] = useState<ApiResult<Data>>({ status: "loading" });

  useEffect(() => {
    fetch(url)
      .then((response) => {
        if (response.status === 200) {
          return response.json();
        } else {
          // TODO: handle various errors
        }
      })
      .then((json) => {
        const jsonObject = z.object({ data: z.unknown() }).parse(json);

        const data = RawData.parse(jsonObject.data);

        const parsedData = parser(data);

        setResult({ status: "ok", result: parsedData });
      });
  }, [url]);

  return result;
};
