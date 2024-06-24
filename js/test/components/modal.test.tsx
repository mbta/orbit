import { Modal } from "../../components/modal";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Modal", () => {
  test("displays modal with title and contents", () => {
    const onClose = jest.fn();

    const view = render(
      <Modal show={true} title={<>Test title</>} onClose={onClose}>
        <>Test contents.</>
      </Modal>,
    );

    expect(view.getByRole("dialog")).toBeInTheDocument();
    expect(view.getByText(/Test title/)).toBeInTheDocument();
    expect(view.getByText(/Test contents/)).toBeInTheDocument();
  });

  test("displays nothing when show is set to false", () => {
    const onClose = jest.fn();

    const view = render(
      <Modal show={false} title={<>Test title</>} onClose={onClose}>
        <>Test contents.</>
      </Modal>,
    );

    expect(view.queryByRole("dialog")).not.toBeInTheDocument();
    expect(view.queryByText(/Test title/)).not.toBeInTheDocument();
    expect(view.queryByText(/Test contents/)).not.toBeInTheDocument();
  });

  test("clicking the close button invokes the close callback", async () => {
    const onClose = jest.fn();

    const view = render(
      <Modal show={true} title={<>Test title</>} onClose={onClose}>
        <>Test contents.</>
      </Modal>,
    );

    await userEvent.click(view.getByRole("button"));

    expect(onClose).toHaveBeenCalled();
  });
});
