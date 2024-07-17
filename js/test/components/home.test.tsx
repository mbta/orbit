import { Home } from "../../components/home";
import { render } from "@testing-library/react";

jest.mock("../../components/operatorSignIn/operatorSignInModal", () => ({
  OperatorSignInModal: () => <div>Mock modal</div>,
}));

describe("home", () => {
  test("loads orbit placeholder", () => {
    const view = render(<Home />);
    expect(view.getByText(/🪐/)).toBeInTheDocument();
  });
});
