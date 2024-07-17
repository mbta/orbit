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

            // On success we want the reader to stop listening for NFC
            // taps. If we didn't make this call, the NDEFReader would
            // continue listening for taps as long as the `useNfc`
            // hook was mounted. For instance, while later on in the
            // sign-in workflow, you could tap a badge on your phone
            // and it would make a little vibration indicating the
            // card had been read, but it would have no effect on the
            // application. With this call to abortController.abort(),
            // it will stop reading once we get a successful scan and
            // won't start reading again until you start a new sign-in
            // flow and a new copy of the useNfc hook is mounted.
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
