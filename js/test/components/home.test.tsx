import { fetch } from "../../browser";
import { Home } from "../../components/home";
import { neverPromise } from "../helpers/promiseWithResolvers";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

jest.mock("../../components/operatorSignIn/operatorSignInModal", () => ({
  __esModule: true,
  OperatorSignInModal: ({
    show,
    onComplete,
  }: {
    show: boolean;
    onComplete: () => void;
  }) => {
    return show ?
        <div>
          <h1>Fit for Duty Check</h1>
          <button onClick={onComplete}>Complete</button>
        </div>
      : null;
  },
}));

// doMock doesn't hoist, which is needed because we're
//  relying on neverPromise
jest.doMock("../../browser", () => ({
  fetch: jest.fn().mockReturnValue(neverPromise),
}));

describe("home", () => {
  test("can open modal", async () => {
    const view = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(view.queryByText(/fit for duty/i)).not.toBeInTheDocument();
    await userEvent.click(
      view.getByRole("button", { name: "Sign In Operator" }),
    );
    expect(view.getByText(/fit for duty/i)).toBeInTheDocument();
  });

  test("can reload the List on new sign-in", async () => {
    const view = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    await userEvent.click(
      view.getByRole("button", { name: "Sign In Operator" }),
    );

    // Clear fetch's counter so we don't catch calls from initial render
    jest.mocked(fetch).mockClear();
    await userEvent.click(view.getByRole("button", { name: "Complete" }));
    expect(fetch).toHaveBeenCalledWith("/api/signin?line=blue");
  });
});
