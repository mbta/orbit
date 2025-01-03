import { daysBetween } from "../../dateTime";
import {
  Certification,
  humanReadableType,
  isExpired,
} from "../../models/certification";
import { className } from "../../util/dom";
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
    <div
      className={className([
        "mb-4 mt-2 flex flex-row rounded border-0 px-3 py-2",
        mode === "warning" && "bg-[#FFDE9E]",
        mode === "error" && "bg-[#FF919A]",
      ])}
    >
      <div className="m-0 flex-1 text-xs leading-4">
        <p className="font-bold uppercase">{title}</p>
        <p className="mt-2">{innerString}</p>
        {mode === "warning" && (
          <p className="mt-2">Please have them call the Office.</p>
        )}
      </div>
    </div>
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
            expiresSoon.length === 1 ? "Card expires soon" : "Cards expire soon"
          }
          operatorName={displayName}
          certifications={expiresSoon}
        />
      )}
      {expired.length > 0 && !ignoreExpired && (
        <CertificateBox
          now={now}
          mode="error"
          title={expired.length === 1 ? "Expired card" : "Expired cards"}
          operatorName={displayName}
          certifications={expired}
        />
      )}
    </>
  );
};

export const Bypass = ({
  displayName,
  expireds,
  onContinue,
}: {
  displayName: string;
  expireds: Certification[];
  onContinue: () => void;
}): ReactElement => {
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
            Take a picture of {expireds.length === 1 ? "the card" : "the cards"}
            .
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
