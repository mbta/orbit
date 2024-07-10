import { useEffect, useState } from "react";

export type NfcResult =
  | { status: "reading" }
  | { status: "success"; data: string }
  | { status: "cancelled" }
  | { status: "error"; error: Error };

export const useNfc = (cancel: AbortController): NfcResult => {
  const [result, setResult] = useState<NfcResult>({ status: "reading" });

  useEffect(() => {
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
  }, [cancel]);

  return result;
};

const dehexSerial = (hexedSerial: string): string => {
  const bytes = hexedSerial.split(":");
  const hexValue = bytes.join("");
  const decimalValue = parseInt(hexValue, 16);
  return decimalValue.toString();
};
