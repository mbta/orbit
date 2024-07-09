import { fetch, reload } from "./browser";
import { useEffect, useState } from "react";
import { z } from "zod";

export type ApiResult<Result> =
  | { status: "loading" }
  | { status: "ok"; result: Result }
  | { status: "error" };

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
        } else if (response.status === 401) {
          reload();

          throw new Error("Unauthenticated");
        } else {
          // TODO: handle various errors
        }
      })
      .then((json) => {
        const jsonObject = z.object({ data: z.unknown() }).parse(json);

        const data = RawData.parse(jsonObject.data);

        const parsedData = parser(data);

        setResult({ status: "ok", result: parsedData });
      })
      .catch(() => {
        setResult({ status: "error" });
      });
  }, [url, RawData, parser]);

  return result;
};
