import { getMetaContent } from "./util/metadata";
import * as Sentry from "@sentry/react";

const sentryDsn = getMetaContent("sentryDsn");
const sentryEnvironment = getMetaContent("sentryEnvironment");
const release = getMetaContent("release");
const userEmail = getMetaContent("userEmail");

if (sentryDsn !== null && sentryEnvironment !== null) {
  Sentry.init({
    dsn: sentryDsn,
    environment: sentryEnvironment,
    release: release ?? undefined,
  });

  if (userEmail !== null) {
    Sentry.setUser({ email: userEmail });
  }
}
