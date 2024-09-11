import { getMetaContent } from "./util/metadata";
import * as Sentry from "@sentry/react";

const sentryDsn = getMetaContent("sentryDsn");
const environment = getMetaContent("environment");
const release = getMetaContent("release");
const userEmail = getMetaContent("userEmail");

if (sentryDsn !== null && environment !== null) {
  Sentry.init({
    dsn: sentryDsn,
    environment,
    release: release ?? undefined,
  });

  if (userEmail !== null) {
    Sentry.setUser({ email: userEmail });
  }
}
