import { nfcSupported } from "../util/nfc";
import { useEffect, useState } from "react";

export type NfcResult =
  | { status: "nfcUnsupported" }
  | { status: "reading" }
  | { status: "success"; data: string }
  | { status: "cancelled" }
  | { status: "error"; error: Error };

export const useNfc = (cancel: AbortController): NfcResult => {
  const supported = nfcSupported();

  const [result, setResult] = useState<NfcResult>({
    status: supported ? "reading" : "nfcUnsupported",
  });

  useEffect(() => {
    if (supported) {
      const reader = new NDEFReader();

      reader.scan({ signal: cancel.signal }).catch((error: unknown) => {
        if (error instanceof Error) {
          setResult({ status: "error", error });
        }
      });

      reader.addEventListener(
        "reading",
        (event: Event) => {
          if (event instanceof NDEFReadingEvent) {
            setResult({
              status: "success",
              data: dehexSerial(event.serialNumber),
            });
            cancel.abort();
          }
        },
        { once: true },
      );

      cancel.signal.addEventListener("abort", () => {
        setResult((result) => {
          if (result.status === "success") {
            return result;
          } else {
            return { status: "cancelled" };
          }
        });
      });

      return () => {
        cancel.abort();
      };
    }
  }, [cancel, supported]);

  return result;
};

const dehexSerial = (hexedSerial: string): string => {
  const bytes = hexedSerial.split(":");
  const hexValue = bytes.join("");
  const decimalValue = parseInt(hexValue, 16);
  return decimalValue.toString();
};
