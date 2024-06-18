import { Modal } from "../../components/modal";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("Modal", () => {
  test("displays modal with title and contents", () => {
    const onHide = jest.fn();

    const view = render(
      <Modal show={true} title={<>Test title</>} onHide={onHide}>
        <>Test contents.</>
      </Modal>,
    );

    expect(view.getByRole("dialog")).toBeInTheDocument();
    expect(view.getByText(/Test title/)).toBeInTheDocument();
    expect(view.getByText(/Test contents/)).toBeInTheDocument();
  });

  test("displays nothing when show is set to false", () => {
    const onHide = jest.fn();

    const view = render(
      <Modal show={false} title={<>Test title</>} onHide={onHide}>
        <>Test contents.</>
      </Modal>,
    );

    expect(view.queryByRole("dialog")).toBeNull();
    expect(view.queryByText(/Test title/)).toBeNull();
    expect(view.queryByText(/Test contents/)).toBeNull();
  });

  test("clicking the close button invokes the close callback", async () => {
    const onHide = jest.fn();

    const view = render(
      <Modal show={true} title={<>Test title</>} onHide={onHide}>
        <>Test contents.</>
      </Modal>,
    );

    await userEvent.click(view.getByRole("button"));

    expect(onHide).toHaveBeenCalled();
  });
});
