import { before } from "node:test";
import { LadderPage } from "../../components/ladderPage/ladderPage";
import { LandingPage } from "../../components/landingPage";
import { Operators } from "../../components/operators";
import { RedirectUser } from "../../components/redirectUser";
import {
  ORBIT_BL_FFD,
  ORBIT_BL_STAKEHOLDERS,
  ORBIT_HR_STAKEHOLDERS,
  ORBIT_RL_TRAINSTARTERS,
  ORBIT_TID_STAFF,
} from "../../groups";
import { getMetaContent } from "../../util/metadata";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";

jest.mock("../../util/metadata", () => ({
  getMetaContent: jest.fn(),
}));
const mockGetMetaContent = getMetaContent as jest.MockedFunction<
  typeof getMetaContent
>;

describe("RedirectUser from root /", () => {
  describe("/landing", () => {
    test("BL stakeholders are redirected to /landing", async () => {
      before(() => {
        mockGetMetaContent.mockReturnValue(ORBIT_BL_STAKEHOLDERS);
      });

      const view = render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<RedirectUser />} />
            <Route path="/landing" element={<LandingPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(
          view.getByText("Which line would you like to view?"),
        ).toBeInTheDocument();
      });
    });

    test("HR stakeholders are redirected to /landing", async () => {
      before(() => {
        mockGetMetaContent.mockReturnValue(ORBIT_HR_STAKEHOLDERS);
      });

      const view = render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<RedirectUser />} />
            <Route path="/landing" element={<LandingPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(
          view.getByText("Which line would you like to view?"),
        ).toBeInTheDocument();
      });
    });

    test("Orbit TID Staff are redirected to /landing", async () => {
      before(() => {
        mockGetMetaContent.mockReturnValue(ORBIT_TID_STAFF);
      });

      const view = render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<RedirectUser />} />
            <Route path="/landing" element={<LandingPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(
          view.getByText("Which line would you like to view?"),
        ).toBeInTheDocument();
      });
    });

    test("Any other groups are not redirected to /landing", async () => {
      before(() => {
        mockGetMetaContent.mockReturnValue(
          ORBIT_BL_FFD + "," + ORBIT_RL_TRAINSTARTERS,
        );
      });

      const view = render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<RedirectUser />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/operators" element={<Operators />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(
          view.queryByText("Which line would you like to view?"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("/operators", () => {
    test("BL trainstarters are redirected to /operators", async () => {
      before(() => {
        mockGetMetaContent.mockReturnValue(ORBIT_BL_FFD);
      });

      const view = render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<RedirectUser />} />
            <Route path="/operators" element={<Operators />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(
          view.getByText("Search and sign in operators"),
        ).toBeInTheDocument();
      });
    });

    test("Any other groups are not redirected to /operators", async () => {
      before(() => {
        mockGetMetaContent.mockReturnValue(
          ORBIT_RL_TRAINSTARTERS +
            "," +
            ORBIT_BL_STAKEHOLDERS +
            "," +
            ORBIT_HR_STAKEHOLDERS +
            "," +
            ORBIT_TID_STAFF,
        );
      });

      const view = render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<RedirectUser />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/operators" element={<Operators />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(
          view.queryByText("Search and sign in operators"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("/ladder", () => {
    test("Any users that are NOT BL/HR Stakeholders, Orbit TID Staff, BL trainstarters are redirected to /ladder", async () => {
      before(() => {
        mockGetMetaContent.mockReturnValue(ORBIT_RL_TRAINSTARTERS);
      });

      const view = render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<RedirectUser />} />
            <Route path="/ladder" element={<LadderPage routeId="Red" />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(view.getByText("Alewife")).toBeInTheDocument();
      });
    });

    test("Any users that ARE BL/HR Stakeholders, Orbit TID Staff, BL trainstarters are not redirected to /ladder", async () => {
      before(() => {
        mockGetMetaContent.mockReturnValue(
          ORBIT_BL_FFD +
            "," +
            ORBIT_BL_STAKEHOLDERS +
            "," +
            ORBIT_HR_STAKEHOLDERS +
            "," +
            ORBIT_TID_STAFF,
        );
      });

      const view = render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<RedirectUser />} />
            <Route path="/ladder" element={<LadderPage routeId="Red" />} />
            <Route path="/landing" element={<LandingPage />} />
          </Routes>
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(view.queryByText("Alewife")).not.toBeInTheDocument();
      });
    });
  });
});
