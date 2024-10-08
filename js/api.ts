import { fetch, reload } from "./browser";
import { getMetaContent } from "./util/metadata";
import { captureException } from "@sentry/react";
import { useEffect, useState } from "react";
import { z } from "zod";

export type ApiResult<Result> =
  | { status: "loading" }
  | { status: "ok"; result: Result }
  | { status: "error"; error?: unknown };

export const post = (url: string, body: object): Promise<Response> => {
  const csrfToken = getMetaContent("csrf-token");
  if (csrfToken === null) {
    throw new Error("Cannot POST; csrf-token was null");
  }
  return fetch(url, {
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    method: "post",
    body: JSON.stringify(body),
  });
};

export const get = <RawData, Data>({
  RawData,
  url,
  parser,
}: {
  RawData: z.ZodType<RawData>;
  url: string;
  parser: (data: RawData) => Data;
}): Promise<Data> => {
  return fetch(url)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else if (response.status === 401) {
        reload();

        throw new Error("Unauthenticated");
      } else {
        throw new Error(`Unrecognized response code: ${response.status}`);
      }
    })
    .then((json) => {
      const jsonObject = z.object({ data: z.unknown() }).parse(json);
      const data = RawData.parse(jsonObject.data);
      const parsedData = parser(data);
      return parsedData;
    })
    .catch((e: unknown) => {
      captureException(e);
      throw e;
    });
};

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
    get({ RawData, url, parser })
      .then((parsedData) => {
        setResult({ status: "ok", result: parsedData });
      })
      .catch((e: unknown) => {
        console.error(e);
        setResult({ status: "error", error: e });
      });
  }, [url, RawData, parser]);

  return result;
};
