import { fetch } from "../../browser";
import { App } from "../../components/app";
import { render } from "@testing-library/react";

describe("App", () => {
  //NOTE: skipping this test while root path temporarily reroutes to /operators.
  //TODO: do not skip this once root path is no longer just rerouting.
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip("error boundary renders on error", () => {
    // Cause an error to be thrown anywhere in the app
    (fetch as jest.MockedFn<typeof fetch>).mockImplementation(() => {
      throw new Error(
        "Ah, Houston, we've had a problem. We've had a Main B Bus Undervolt.",
      );
    });

    jest.spyOn(console, "error").mockImplementation(() => {});
    const view = render(<App />);
    expect(
      view.getByText("Sorry, something went wrong. It's not you, it's us."),
    ).toBeInTheDocument();
  });
});
