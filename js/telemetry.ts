import { getMetaContent } from "./util/metadata";
import { FullStory, init as initFullStory } from "@fullstory/browser";
import { fullStoryIntegration } from "@sentry/fullstory";
import * as Sentry from "@sentry/react";

const environment = getMetaContent("environment");
const release = getMetaContent("release");
const userName = getMetaContent("userName");
const userEmail = getMetaContent("userEmail");

const fullStoryOrgId = getMetaContent("fullStoryOrgId");

const SENTRY_ORG_SLUG = "mbtace";
const sentryDsn = getMetaContent("sentryDsn");

// FullStory
if (fullStoryOrgId !== null && userEmail !== null) {
  initFullStory({ orgId: fullStoryOrgId });
  FullStory("setIdentity", {
    uid: userEmail,
    properties: {
      displayName: userName,
      email: userEmail,
    },
  });
}

// Sentry
if (sentryDsn !== null && environment !== null) {
  Sentry.init({
    dsn: sentryDsn,
    environment,
    release: release ?? undefined,
    integrations:
      fullStoryOrgId !== null ?
        [fullStoryIntegration(SENTRY_ORG_SLUG, { client: FullStory })]
      : [],
  });

  if (userEmail !== null) {
    Sentry.setUser({ email: userEmail });
  }
}
