import {
  Bypass,
  CertificateBoxes,
  Instructions,
} from "../../../components/operatorSignIn/expiry";
import { Certification } from "../../../models/certification";
import { certificationFactory } from "../../helpers/factory";
import { render } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { DateTime } from "luxon";

const CERTIFICATIONS_ONE: Certification[] = [
  certificationFactory.build({
    type: "rail",
    expires: DateTime.fromISO("2024-05-18"),
  }),
];
const CERTIFICATIONS_TWO: Certification[] = [
  certificationFactory.build({
    type: "rail",
    expires: DateTime.fromISO("2024-05-18"),
  }),
  certificationFactory.build({
    type: "right_of_way",
    expires: DateTime.fromISO("2024-05-18"),
  }),
];
const CERTIFICATIONS_TWO_SPLIT = [
  certificationFactory.build({
    type: "rail",
    expires: DateTime.fromISO("2024-05-04"),
  }),
  certificationFactory.build({
    type: "right_of_way",
    expires: DateTime.fromISO("2024-05-14"),
  }),
];

describe("CertificateBoxes", () => {
  describe("title grammar", () => {
    test("singular title", () => {
      const view = render(
        <CertificateBoxes
          now={DateTime.fromISO("2024-05-10T03:55:00.000Z")}
          certifications={CERTIFICATIONS_ONE}
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
          certifications={CERTIFICATIONS_TWO}
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
            certifications={CERTIFICATIONS_TWO}
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
            certifications={CERTIFICATIONS_ONE}
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
            certifications={CERTIFICATIONS_ONE}
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
            certifications={CERTIFICATIONS_ONE}
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
            certifications={CERTIFICATIONS_ONE}
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
            certifications={CERTIFICATIONS_ONE}
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
            certifications={CERTIFICATIONS_TWO}
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
            certifications={[
              ...CERTIFICATIONS_ONE,
              certificationFactory.build({
                type: "right_of_way",
                expires: DateTime.fromISO("2024-07-06"),
              }),
            ]}
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
            certifications={CERTIFICATIONS_ONE}
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
            certifications={CERTIFICATIONS_ONE}
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
            certifications={CERTIFICATIONS_TWO}
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
            certifications={CERTIFICATIONS_ONE}
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
            certifications={CERTIFICATIONS_TWO_SPLIT}
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
  });
  test("ignoreExpired=true suppresses the expired box", () => {
    const view = render(
      <CertificateBoxes
        now={DateTime.fromISO("2024-05-09T19:19:02.485Z")}
        certifications={CERTIFICATIONS_TWO_SPLIT}
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
        certifications={CERTIFICATIONS_ONE}
        now={DateTime.fromISO("2024-05-26T09:08:34.123")}
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
          now={DateTime.fromISO("2024-05-23T09:08:34.123")}
          certifications={CERTIFICATIONS_ONE}
          displayName="Test Name"
          onContinue={continueFn}
        />,
      );
      expect(view.getByText(/the card./)).toBeInTheDocument();
    });
    test("plural if two cards", () => {
      const continueFn = jest.fn();
      const view = render(
        <Bypass
          now={DateTime.fromISO("2024-05-23T09:08:34.123")}
          certifications={CERTIFICATIONS_TWO}
          displayName="Test Name"
          onContinue={continueFn}
        />,
      );
      expect(view.getByText(/both cards./)).toBeInTheDocument();
    });
  });

  test("Displays human readable name", () => {
    const continueFn = jest.fn();
    const view = render(
      <Bypass
        now={DateTime.fromISO("2024-05-26T09:08:34.123")}
        certifications={CERTIFICATIONS_TWO}
        displayName="Test Name"
        onContinue={continueFn}
      />,
    );
    expect(view.getByText(/ROW Card/)).toBeInTheDocument();
  });
});

describe("Instructions", () => {
  test("Contains ordered list", () => {
    const view = render(<Instructions displayName="Test Name" />);
    expect(view.getByRole("list")).toBeInTheDocument();
  });
});
