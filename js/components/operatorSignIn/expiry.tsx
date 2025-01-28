import { daysBetween } from "../../dateTime";
import {
  Certification,
  CertificationStatus,
  filterExpiresSoon,
  humanReadableType,
  MissingCertification,
} from "../../models/certification";
import { className } from "../../util/dom";
import { DateTime } from "luxon";
import { ReactElement, ReactNode } from "react";

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

const Box = ({
  title,
  mode,
  children,
}: {
  title: string;
  mode: "warning" | "error";
  children: ReactNode;
}): ReactElement => {
  return (
    <div
      className={className([
        "mb-4 mt-2 flex flex-row rounded px-3 py-2",
        mode === "warning" && "bg-[#FFDE9E]",
        mode === "error" && "bg-[#FF919A]",
      ])}
    >
      <div className="m-0 flex-1 text-xs leading-4">
        <p className="font-bold uppercase">{title}</p>
        {children}
      </div>
    </div>
  );
};

const MissingBox = ({
  missing,
  operatorName,
}: {
  missing: MissingCertification[];
  operatorName: string;
}): ReactElement => {
  return (
    <Box mode={"error"} title={"Missing card data"}>
      <p className="mt-2">
        We have no record of {operatorName}&apos;s{" "}
        {missing.map((m) => humanReadableType(m.type)).join(" nor ")}.
      </p>
    </Box>
  );
};

const ExpiryBox = ({
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
    <Box mode={mode} title={title}>
      <p className="mt-2">{innerString}</p>
      {mode === "warning" && (
        <p className="mt-2">Please have them call the Office.</p>
      )}
    </Box>
  );
};

export const CertificateBoxes = ({
  now,
  displayName,
  ignoreExpired,
  certificationStatus,
}: {
  now: DateTime;
  displayName: string;
  ignoreExpired: boolean;
  certificationStatus: CertificationStatus;
}): ReactElement => {
  const expiresSoon = filterExpiresSoon(certificationStatus.active, now);

  return (
    <>
      {expiresSoon.length > 0 && (
        <ExpiryBox
          now={now}
          mode="warning"
          title={
            expiresSoon.length === 1 ? "Card expires soon" : "Cards expire soon"
          }
          operatorName={displayName}
          certifications={expiresSoon}
        />
      )}
      {certificationStatus.expired.length > 0 && !ignoreExpired && (
        <ExpiryBox
          now={now}
          mode="error"
          title={
            certificationStatus.expired.length === 1 ?
              "Expired card"
            : "Expired cards"
          }
          operatorName={displayName}
          certifications={certificationStatus.expired}
        />
      )}
      {certificationStatus.missing.length > 0 && (
        <MissingBox
          operatorName={displayName}
          missing={certificationStatus.missing}
        />
      )}
    </>
  );
};

export const Bypass = ({
  displayName,
  expireds,
  missing,
  onContinue,
}: {
  displayName: string;
  expireds: Certification[];
  missing: MissingCertification[];
  onContinue: () => void;
}): ReactElement => {
  const expiredAndMissing = [
    ...expireds.map((c) => humanReadableType(c.type)),
    ...missing.map((m) => humanReadableType(m.type)),
  ];
  return (
    <>
      <hr className="h-[2px] bg-gray-300" />
      <div className="m-2 text-sm text-gray-400">
        <p>Is this warning incorrect?</p>
        <span>
          If {displayName} has a valid {expiredAndMissing.join(" and ")}:
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
