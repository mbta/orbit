import { getMetaContent } from "../util/metadata";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  const Appcues: {
    identify(
      userId: string,
      properties?: Record<string, string | number | boolean>,
    ): void;
    page(): void;
  };
}

// React component, put inside react router
export const AppcuesTrackPage = (): null => {
  const email = getMetaContent("userEmail") ?? "";
  const appcuesUserId = getMetaContent("appcuesUserId");
  const location = useLocation();
  const appcuesInitialized: boolean = Object.prototype.hasOwnProperty.call(
    globalThis,
    "Appcues",
  );
  useEffect(() => {
    if (appcuesInitialized && appcuesUserId !== null) {
      try {
        Appcues.identify(appcuesUserId, {
          email,
        });
      } catch (error) {
        console.warn(error);
      }
    }
  }, [appcuesInitialized, email, appcuesUserId]);
  useEffect(() => {
    if (appcuesInitialized) {
      try {
        Appcues.page();
      } catch (error) {
        console.warn(error);
      }
    }
  }, [location, appcuesInitialized]);
  return null;
};
