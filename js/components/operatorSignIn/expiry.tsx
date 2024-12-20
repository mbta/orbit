import { daysBetween } from "../../dateTime";
import {
  Certification,
  humanReadableType,
  isExpired,
} from "../../models/certification";
import { className } from "../../util/dom";
import { WarningParagraph } from "./warningParagraph";
import { DateTime } from "luxon";
import { ReactElement } from "react";

const WARN_WITHIN_D = 60;

const englishDaysBetween = (now: DateTime, date: DateTime) => {
  const delta = daysBetween(now, date);
  const wholeAbs = Math.abs(Math.ceil(delta));
  if (delta <= -2) {
    return `expired ${wholeAbs} days ago`;
  } else if (delta <= -1) {
    return "expired yesterday";
  } else if (delta <= 0) {
    return "expired today";
  } else if (delta <= 1) {
    return "expires tomorrow";
  } else {
    return `expires in ${wholeAbs} days`;
  }
};

const CertificateBox = ({
  now,
  mode,
  title,
  operatorName,
  certifications,
}: {
  now: DateTime;
  mode: "warning" | "error";
  title: string;
  operatorName: string;
  certifications: Certification[];
}): ReactElement => {
  const innerString =
    `Our records show that ${operatorName}'s ` +
    certifications
      .map(
        (c) =>
          `${humanReadableType(c.type)} ${englishDaysBetween(
            now,
            c.expires,
          )} on ${c.expires.toLocaleString(DateTime.DATE_SHORT)}`,
      )
      .join(" and ") +
    ".";
  return (
    <WarningParagraph
      className={className([
        "border-0 light:bg-opacity-40 dark:bg-opacity-30 dark:text-white",
        mode === "warning" && "bg-[#FFDE9E]",
        mode === "error" && "bg-[#FF919A]",
      ])}
    >
      <p className="font-bold uppercase">{title}</p>
      <p className="mt-2">{innerString}</p>
      {mode === "warning" && (
        <p className="mt-2">Please have them call the Office.</p>
      )}
    </WarningParagraph>
  );
};

export const CertificateBoxes = ({
  now,
  displayName,
  ignoreExpired,
  certifications,
}: {
  now: DateTime;
  displayName: string;
  ignoreExpired: boolean;
  certifications: Certification[];
}): ReactElement => {
  const expired = certifications.filter((cert) => isExpired(cert, now));
  const expiresSoon = certifications.filter((cert) => {
    const delta = daysBetween(now, cert.expires);
    return !isExpired(cert, now) && delta <= WARN_WITHIN_D;
  });
  return (
    <>
      {expiresSoon.length > 0 && (
        <CertificateBox
          now={now}
          mode="warning"
          title={
            expiresSoon.length === 2 ? "Cards expire soon" : "Card expires soon"
          }
          operatorName={displayName}
          certifications={expiresSoon}
        />
      )}
      {expired.length > 0 && !ignoreExpired && (
        <CertificateBox
          now={now}
          mode="error"
          title={expired.length === 2 ? "Expired cards" : "Expired card"}
          operatorName={displayName}
          certifications={expired}
        />
      )}
    </>
  );
};

export const Instructions = ({
  displayName,
}: {
  displayName: string;
}): ReactElement => {
  return (
    <ol className="m-8 mr-0 list-decimal">
      <li>Do not allow {displayName} to drive.</li>
      <li>Call the Office.</li>
      <li>Send {displayName} to the Supervisors&#39; Office.</li>
    </ol>
  );
};
export const Bypass = ({
  displayName,
  certifications,
  now,
  onContinue,
}: {
  displayName: string;
  certifications: Certification[];
  now: DateTime;
  onContinue: () => void;
}): ReactElement => {
  const expireds = certifications.filter((c) => isExpired(c, now));

  return (
    <>
      <hr className="h-[2px] bg-gray-300" />
      <div className="m-2 text-sm text-gray-400">
        <p>Is this warning incorrect?</p>
        <span>
          If {displayName} has a valid{" "}
          {expireds.map((c) => humanReadableType(c.type)).join(" and ")}:
        </span>
        <ol className="mb-4 ml-10 mr-0 mt-2 list-decimal">
          <li className="m-0">
            Take a picture of{" "}
            {expireds.length === 2 ? "both cards" : "the card"}.
          </li>
          <li className="m-0">Email pictures to supervisors.</li>
          <li className="m-0">Continue to Fit for Duty Check.</li>
        </ol>
        <button className="underline" onClick={onContinue}>
          Continue to Fit for Duty Check →
        </button>
      </div>
    </>
  );
};
