import { getMetaContent } from "./util/metadata";
import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router-dom";

const sentryDsn = getMetaContent("sentryDsn");
const sentryEnvironment = getMetaContent("sentryEnvironment");
const release = getMetaContent("release");
const userEmail = getMetaContent("userEmail");

if (sentryDsn !== null && sentryEnvironment !== null) {
  console.log("Initializing sentry with DSN", sentryDsn);
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    release: release ?? undefined,
    debug: true,
    integrations: [
      // See docs for support of different versions of variation of react router
      // https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],
  });

  if (userEmail !== null) {
    Sentry.setUser({ email: userEmail });
  }
}
