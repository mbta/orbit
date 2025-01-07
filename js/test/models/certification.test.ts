import { filterRelevantForOperator } from "../../models/certification";
import { certificationFactory } from "../helpers/factory";

describe("filterRelevantForOperator", () => {
  test("keep rail cert for BL", () => {
    expect(
      filterRelevantForOperator(
        [
          certificationFactory.build({
            railLine: "blue",
            type: "rail",
          }),
        ],
        "blue",
      ),
    ).toHaveLength(1);
  });

  test("ignore rail cert OL when BL", () => {
    expect(
      filterRelevantForOperator(
        [
          certificationFactory.build({
            railLine: "orange",
            type: "rail",
          }),
        ],
        "blue",
      ),
    ).toHaveLength(0);
  });

  test("ignore rail cert for none line when BL", () => {
    expect(
      filterRelevantForOperator(
        [
          certificationFactory.build({
            railLine: "none",
            type: "rail",
          }),
        ],
        "blue",
      ),
    ).toHaveLength(0);
  });

  test("keep ROW cert with none line for BL", () => {
    expect(
      filterRelevantForOperator(
        [
          certificationFactory.build({
            railLine: "none",
            type: "right_of_way",
          }),
        ],
        "blue",
      ),
    ).toHaveLength(1);
  });

  test("keep ROW cert with blue line for BL", () => {
    expect(
      filterRelevantForOperator(
        [
          certificationFactory.build({
            railLine: "blue",
            type: "right_of_way",
          }),
        ],
        "blue",
      ),
    ).toHaveLength(1);
  });
});
