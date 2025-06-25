import {
  ORBIT_RL_TRAINSTARTERS,
  ORBIT_TID_STAFF,
  userHasOneOf,
} from "../groups";
import { MetaDataKey } from "../util/metadata";

jest.mock("../util/metadata", () => ({
  getMetaContent: jest
    .fn()
    .mockImplementation((field: MetaDataKey): string | null => {
      if (field === "userGroups") {
        return [ORBIT_RL_TRAINSTARTERS, ORBIT_TID_STAFF].join(",");
      }
      return null;
    }),
}));

describe("userHasOneOf", () => {
  test("has one group", () => {
    expect(userHasOneOf([ORBIT_TID_STAFF])).toBeTrue();
  });

  test("has either group (one does not exist)", () => {
    expect(
      userHasOneOf([ORBIT_TID_STAFF, "SOME-NONEXISTENT-GROUP"]),
    ).toBeTrue();
  });

  test("has either group (both exist)", () => {
    expect(userHasOneOf([ORBIT_TID_STAFF, ORBIT_RL_TRAINSTARTERS])).toBeTrue();
  });

  test("has either group (both do not exist)", () => {
    expect(
      userHasOneOf(["SOME-NONEXISTENT-GROUP", "SOME-OTHER-NONEXISTENT-GROUP"]),
    ).toBeFalse();
  });
});
