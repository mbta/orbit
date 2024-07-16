import { nfcSupported } from "../util/nfc";
import { useEffect, useState } from "react";

export type NfcResult =
  | { status: "nfcUnsupported" }
  | { status: "reading" }
  | { status: "success"; data: string }
  | { status: "cancelled" }
  | { status: "error"; error: unknown };

export const useNfc = (): {
  result: NfcResult;
  abortController: AbortController | null;
} => {
  const supported = nfcSupported();

  const [result, setResult] = useState<NfcResult>({
    status: supported ? "reading" : "nfcUnsupported",
  });

  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  useEffect(() => {
    if (supported) {
      setAbortController(new AbortController());
    } else {
      setAbortController(null);
    }
  }, [supported]);

  useEffect(() => {
    if (supported && abortController) {
      const reader = new NDEFReader();

      reader
        .scan({ signal: abortController.signal })
        .catch((error: unknown) => {
          setResult({ status: "error", error });
        });

      reader.addEventListener(
        "reading",
        (event: Event) => {
          if (event instanceof NDEFReadingEvent) {
            setResult({
              status: "success",
              data: dehexSerial(event.serialNumber),
            });

            abortController.abort();
          } else {
            throw new Error("Unrecognized scan event");
          }
        },
        { once: true },
      );

      abortController.signal.addEventListener("abort", () => {
        setResult((result) => {
          if (result.status === "success") {
            return result;
          } else {
            return { status: "cancelled" };
          }
        });
      });

      return () => {
        abortController.abort();
      };
    } else if (!supported) {
      setResult({ status: "nfcUnsupported" });
    }
  }, [abortController, supported]);

  return { result, abortController };
};

const dehexSerial = (hexedSerial: string): string => {
  const bytes = hexedSerial.split(":");
  const hexValue = bytes.join("");
  const decimalValue = parseInt(hexValue, 16);
  return decimalValue.toString();
};
