import { App } from "../../components/app";
import { render } from "@testing-library/react";

describe("App", () => {
  test("error boundary renders on error", () => {
    jest.mock("../../components/operatorSignIn/operatorSignInModal", () => ({
      OperatorSignInModal: () => {
        throw new Error(
          "Ah, Houston, we've had a problem. We've had a Main B Bus Undervolt.",
        );
      },
    }));

    jest.spyOn(console, "error").mockImplementation(() => {});
    const view = render(<App />);
    expect(
      view.getByText("Sorry, something went wrong. It's not you, it's us."),
    ).toBeInTheDocument();
  });
});
