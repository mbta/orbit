import { Home } from "../../components/home";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("../../components/operatorSignIn/operatorSignInModal", () => ({
  OperatorSignInModal: () => <div>Mock modal</div>,
}));

describe("home", () => {
  test("loads orbit placeholder", () => {
    const view = render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(view.getByText(/🪐/)).toBeInTheDocument();
  });
});
