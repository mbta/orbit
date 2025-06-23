import { reorder } from "../../util/consist";

describe("reorder", () => {
  test("correctly orders southbound consists", () => {
    // already in the desired order (lead car on left)
    const consist0 = ["1877", "1876", "1807", "1806", "1815", "1814"];
    const fixedConsist0 = reorder("1877", consist0, 0);

    // consist in reverse of desired order (lead car on right)
    const consist1 = ["1814", "1815", "1806", "1807", "1876", "1877"];
    const fixedConsist1 = reorder("1877", consist1, 0);

    expect(fixedConsist0).toStrictEqual([
      "1877",
      "1876",
      "1807",
      "1806",
      "1815",
      "1814",
    ]);
    expect(fixedConsist1).toStrictEqual([
      "1877",
      "1876",
      "1807",
      "1806",
      "1815",
      "1814",
    ]);
  });

  test("correctly orders northbound consists", () => {
    // already in the desired order (lead car on right)
    const consist0 = ["1877", "1876", "1807", "1806", "1815", "1814"];
    const fixedConsist0 = reorder("1814", consist0, 1);

    // consist in reverse of desired order (lead car on left)
    const consist1 = ["1814", "1815", "1806", "1807", "1876", "1877"];
    const fixedConsist1 = reorder("1814", consist1, 1);

    expect(fixedConsist0).toStrictEqual([
      "1877",
      "1876",
      "1807",
      "1806",
      "1815",
      "1814",
    ]);
    expect(fixedConsist1).toStrictEqual([
      "1877",
      "1876",
      "1807",
      "1806",
      "1815",
      "1814",
    ]);
  });

  test("logs error and returns unmodified consist if lead car not found", () => {
    console.error = jest.fn();
    const consist = ["1877", "1876", "1807", "1806", "1815", "1814"];
    const fixedConsist = reorder("1806", consist, 1);

    expect(fixedConsist).toStrictEqual([
      "1877",
      "1876",
      "1807",
      "1806",
      "1815",
      "1814",
    ]);
    expect(console.error).toHaveBeenCalledWith(
      "vehicle label 1806 is not the lead car in consist",
      consist,
    );
  });
});
