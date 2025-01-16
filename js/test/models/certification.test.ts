import { dateTimeFromISO } from "../../dateTime";
import {
  filterRelevantForOperators,
  getMissing,
} from "../../models/certification";
import { certificationFactory } from "../helpers/factory";

describe("filterRelevantForOperators", () => {
  test("keep rail cert for BL", () => {
    expect(
      filterRelevantForOperators(
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
      filterRelevantForOperators(
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
      filterRelevantForOperators(
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
      filterRelevantForOperators(
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
      filterRelevantForOperators(
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

  test("ignore ROW cert OL for BL", () => {
    expect(
      filterRelevantForOperators(
        [
          certificationFactory.build({
            railLine: "orange",
            type: "right_of_way",
          }),
        ],
        "blue",
      ),
    ).toHaveLength(0);
  });
});

describe("getMissing", () => {
  test("emits right_of_way when missing", () => {
    expect(
      getMissing(
        [
          {
            type: "rail",
            expires: dateTimeFromISO("2082-01-01"),
            railLine: "blue",
          },
        ],
        "blue",
      ),
    ).toEqual([
      {
        type: "right_of_way",
        railLine: "blue",
      },
    ]);
  });

  test("emits rail when missing", () => {
    expect(
      getMissing(
        [
          {
            type: "right_of_way",
            expires: dateTimeFromISO("2082-01-01"),
            railLine: "blue",
          },
        ],
        "blue",
      ),
    ).toEqual([
      {
        type: "rail",
        railLine: "blue",
      },
    ]);
  });

  test("emits both when both missing", () => {
    expect(getMissing([], "blue")).toEqual([
      {
        type: "right_of_way",
        railLine: "blue",
      },
      {
        type: "rail",
        railLine: "blue",
      },
    ]);
  });

  test("emits nothing when both present", () => {
    expect(
      getMissing(
        [
          {
            type: "rail",
            expires: dateTimeFromISO("2082-01-01"),
            railLine: "blue",
          },
          {
            type: "right_of_way",
            expires: dateTimeFromISO("2082-01-01"),
            railLine: "blue",
          },
        ],
        "blue",
      ),
    ).toEqual([]);
  });
});
