import {
  Bypass,
  CertificateBoxes,
} from "../../../components/operatorSignIn/expiry";
import { certificationFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { DateTime } from "luxon";

const CERTIFICATION_RAIL_5_18 = certificationFactory.build({
  type: "rail",
  expires: DateTime.fromISO("2024-05-18", { zone: "America/New_York" }),
});

const CERTIFICATION_ROW_5_18 = certificationFactory.build({
  type: "right_of_way",
  expires: DateTime.fromISO("2024-05-18", { zone: "America/New_York" }),
});

const CERTIFICATION_RAIL_5_4 = certificationFactory.build({
  type: "rail",
  expires: DateTime.fromISO("2024-05-04", { zone: "America/New_York" }),
});

const CERTIFICATION_ROW_5_14 = certificationFactory.build({
  type: "right_of_way",
  expires: DateTime.fromISO("2024-05-14", { zone: "America/New_York" }),
});

describe("CertificateBoxes", () => {
  describe("title grammar", () => {
    test("singular title", () => {
      const view = render(
        <CertificateBoxes
          now={DateTime.fromISO("2024-05-10T03:55:00.000Z")}
          certificationStatus={{
            active: [CERTIFICATION_RAIL_5_18],
            expired: [],
            missing: [],
          }}
          ignoreExpired={false}
          displayName={"Test Name"}
        />,
      );
      expect(view.getByText("Card expires soon")).toBeInTheDocument();
    });
    test("plural title", () => {
      const view = render(
        <CertificateBoxes
          now={DateTime.fromISO("2024-05-10T03:55:00.000Z")}
          certificationStatus={{
            active: [CERTIFICATION_RAIL_5_18, CERTIFICATION_ROW_5_18],
            expired: [],
            missing: [],
          }}
          displayName={"Test Name"}
          ignoreExpired={false}
        />,
      );
      expect(view.getByText("Cards expire soon")).toBeInTheDocument();
    });
  });
  describe("certificate combinations", () => {
    describe("not expiring soon", () => {
      test("nothing is displayed", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-02-10T03:55:00.000Z")}
            certificationStatus={{
              active: [CERTIFICATION_RAIL_5_18, CERTIFICATION_ROW_5_18],
              expired: [],
              missing: [],
            }}
            displayName="Test Name"
            ignoreExpired={false}
          />,
        );
        expect(view.queryByText(/Our records show/)).not.toBeInTheDocument();
      });
    });

    describe("expiring soon", () => {
      test("displays a warning box for one expiring within 30 days", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-05-06T19:19:02.485Z")}
            displayName="Test Name"
            certificationStatus={{
              active: [CERTIFICATION_RAIL_5_18],
              expired: [],
              missing: [],
            }}
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "Our records show that Test Name's Certification Card expires in 12 days on 5/18/2024.",
          ),
        ).toBeInTheDocument();
      });

      test("displays a warning box for one expiring in 30 days", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-04-18T19:19:02.485Z")}
            certificationStatus={{
              active: [CERTIFICATION_RAIL_5_18],
              expired: [],
              missing: [],
            }}
            displayName="Test Name"
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "Our records show that Test Name's Certification Card expires in 30 days on 5/18/2024.",
          ),
        ).toBeInTheDocument();
      });

      test("displays a warning box for one expiring tomorrow (current time ~3pm)", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-05-17T19:19:02.485Z")}
            certificationStatus={{
              active: [CERTIFICATION_RAIL_5_18],
              expired: [],
              missing: [],
            }}
            displayName="Test Name"
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "Our records show that Test Name's Certification Card expires tomorrow on 5/18/2024.",
          ),
        ).toBeInTheDocument();
      });

      test("displays a warning box for one expiring tomorrow (current time 11:55pm)", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-05-18T03:55:00.000Z")}
            certificationStatus={{
              active: [CERTIFICATION_RAIL_5_18],
              expired: [],
              missing: [],
            }}
            displayName="Test Name"
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "Our records show that Test Name's Certification Card expires tomorrow on 5/18/2024.",
          ),
        ).toBeInTheDocument();
      });

      test("displays a warning box for one expiring tomorrow (current time 12:30am)", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-05-18T04:30:00.000Z")}
            displayName="Test Name"
            certificationStatus={{
              active: [],
              expired: [CERTIFICATION_RAIL_5_18],
              missing: [],
            }}
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "Our records show that Test Name's Certification Card expired today on 5/18/2024.",
          ),
        ).toBeInTheDocument();
      });

      test("displays a warning box for two expiring within 60 days", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-03-27T19:19:02.485Z")}
            displayName="Test Name"
            certificationStatus={{
              active: [CERTIFICATION_RAIL_5_18, CERTIFICATION_ROW_5_18],
              expired: [],
              missing: [],
            }}
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "Our records show that Test Name's Certification Card expires in 52 days on 5/18/2024 and ROW Card expires in 52 days on 5/18/2024.",
          ),
        ).toBeInTheDocument();
      });

      test("displays a warning box for one expiring within 30 days, another in 70 not shown", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-05-06T19:19:02.485Z")}
            certificationStatus={{
              active: [
                CERTIFICATION_RAIL_5_18,
                certificationFactory.build({
                  type: "right_of_way",
                  expires: DateTime.fromISO("2024-07-06", {
                    zone: "America/New_York",
                  }),
                }),
              ],
              expired: [],
              missing: [],
            }}
            displayName="Test Name"
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "Our records show that Test Name's Certification Card expires in 12 days on 5/18/2024.",
          ),
        ).toBeInTheDocument();
      });
    });

    describe("expired", () => {
      test("displays an error box for one expired today", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-05-18T19:19:02.485Z")}
            certificationStatus={{
              active: [],
              expired: [CERTIFICATION_RAIL_5_18],
              missing: [],
            }}
            displayName="Test Name"
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "Our records show that Test Name's Certification Card expired today on 5/18/2024.",
          ),
        ).toBeInTheDocument();
      });

      test("displays an error box for one expired 5 days ago", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-05-23T19:19:02.485Z")}
            displayName="Test Name"
            certificationStatus={{
              active: [],
              expired: [CERTIFICATION_RAIL_5_18],
              missing: [],
            }}
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "Our records show that Test Name's Certification Card expired 5 days ago on 5/18/2024.",
          ),
        ).toBeInTheDocument();
      });

      test("displays an error box for two expired 5 days ago", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-05-23T19:19:02.485Z")}
            certificationStatus={{
              active: [],
              expired: [CERTIFICATION_RAIL_5_18, CERTIFICATION_ROW_5_18],
              missing: [],
            }}
            displayName="Test Name"
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "Our records show that Test Name's Certification Card expired 5 days ago on 5/18/2024 and ROW Card expired 5 days ago on 5/18/2024.",
          ),
        ).toBeInTheDocument();
      });

      test("displays an error box for one expired yesterday", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-05-19T19:19:02.485Z")}
            certificationStatus={{
              active: [],
              expired: [CERTIFICATION_RAIL_5_18],
              missing: [],
            }}
            displayName="Test Name"
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "Our records show that Test Name's Certification Card expired yesterday on 5/18/2024.",
          ),
        ).toBeInTheDocument();
      });
    });

    describe("expired and expiring soon", () => {
      test("displays an error box for one expired 5 days ago, plus a warning for one expiring 5 days from now", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-05-09T19:19:02.485Z")}
            certificationStatus={{
              active: [CERTIFICATION_ROW_5_14],
              expired: [CERTIFICATION_RAIL_5_4],
              missing: [],
            }}
            displayName="Test Name"
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "Our records show that Test Name's Certification Card expired 5 days ago on 5/4/2024.",
          ),
        ).toBeInTheDocument();

        expect(
          view.getByText(
            "Our records show that Test Name's ROW Card expires in 5 days on 5/14/2024.",
          ),
        ).toBeInTheDocument();
      });
    });

    describe("missing data", () => {
      test("displays an error box for missing right of way cert", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-05-06T19:19:02.485Z")}
            displayName="Test Name"
            certificationStatus={{
              active: [],
              expired: [],
              missing: [
                {
                  railLine: "blue",
                  type: "right_of_way",
                },
              ],
            }}
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText("We have no record of Test Name's ROW Card."),
        ).toBeInTheDocument();
      });

      test("displays an error box for missing rail cert", () => {
        const view = render(
          <CertificateBoxes
            now={DateTime.fromISO("2024-05-06T19:19:02.485Z")}
            displayName="Test Name"
            certificationStatus={{
              active: [],
              expired: [],
              missing: [
                {
                  railLine: "blue",
                  type: "rail",
                },
              ],
            }}
            ignoreExpired={false}
          />,
        );
        expect(
          view.getByText(
            "We have no record of Test Name's Certification Card.",
          ),
        ).toBeInTheDocument();
      });
    });
  });
  test("ignoreExpired=true suppresses the expired box", () => {
    const view = render(
      <CertificateBoxes
        now={DateTime.fromISO("2024-05-09T19:19:02.485Z")}
        certificationStatus={{
          active: [CERTIFICATION_ROW_5_14],
          expired: [CERTIFICATION_RAIL_5_4],
          missing: [],
        }}
        displayName="Test Name"
        ignoreExpired={true}
      />,
    );
    expect(
      view.queryByText(
        "Our records show that Test Name's Certification Card expired 5 days ago on 5/4/2024.",
      ),
    ).not.toBeInTheDocument();

    expect(
      view.getByText(
        "Our records show that Test Name's ROW Card expires in 5 days on 5/14/2024.",
      ),
    ).toBeInTheDocument();
  });
});

describe("Bypass", () => {
  test("Continue link calls onContinue", async () => {
    const continueFn = jest.fn();
    const user = userEvent.setup();
    const view = render(
      <Bypass
        expireds={[CERTIFICATION_RAIL_5_4]}
        missing={[]}
        displayName="Test Name"
        onContinue={continueFn}
      />,
    );
    await user.click(view.getByRole("button"));
    expect(continueFn).toHaveBeenCalled();
  });

  describe("grammar", () => {
    test("singular if one card", () => {
      const continueFn = jest.fn();
      const view = render(
        <Bypass
          expireds={[CERTIFICATION_RAIL_5_4]}
          missing={[]}
          displayName="Test Name"
          onContinue={continueFn}
        />,
      );
      expect(view.getByText(/the card./)).toBeInTheDocument();
    });
    test("plural if multiple cards", () => {
      const continueFn = jest.fn();
      const view = render(
        <Bypass
          expireds={[CERTIFICATION_RAIL_5_4, CERTIFICATION_ROW_5_14]}
          missing={[]}
          displayName="Test Name"
          onContinue={continueFn}
        />,
      );
      expect(view.getByText(/the cards./)).toBeInTheDocument();
    });
  });

  test("Displays human readable name", () => {
    const continueFn = jest.fn();
    const view = render(
      <Bypass
        expireds={[CERTIFICATION_RAIL_5_4, CERTIFICATION_ROW_5_14]}
        missing={[]}
        displayName="Test Name"
        onContinue={continueFn}
      />,
    );
    expect(view.getByText(/ROW Card/)).toBeInTheDocument();
  });
});
