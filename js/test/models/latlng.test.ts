import { LatLng, proportionBetweenLatLngs } from "../../models/latlng";

describe("proportionBetweenLatLngs", () => {
  test("Between JFK and North Quincy", () => {
    const jfkBSB: LatLng = {
      latitude: 42.320418,
      longitude: -71.052287,
    };
    const northQuincySB: LatLng = {
      latitude: 42.27577,
      longitude: -71.030194,
    };
    const loc: LatLng = {
      latitude: 42.29689,
      longitude: -71.05126,
    };
    // Because this section is curved, a place eyeballed as halfway is actually 0.43
    expect(proportionBetweenLatLngs(jfkBSB, northQuincySB, loc)).toBeCloseTo(
      0.43,
    );
  });

  test("Between North Quincy and Wollaston", () => {
    const northQuincySB: LatLng = {
      latitude: 42.27577,
      longitude: -71.030194,
    };
    const wollastonSB: LatLng = {
      latitude: 42.266762,
      longitude: -71.020542,
    };
    const loc: LatLng = {
      latitude: 42.27081,
      longitude: -71.02507,
    };
    expect(
      proportionBetweenLatLngs(northQuincySB, wollastonSB, loc),
    ).toBeCloseTo(0.54);
  });

  // these aren't realistic latlngs, but the math is still the same
  const a: LatLng = {
    latitude: 1.0,
    longitude: 11.0,
  };

  const b: LatLng = {
    latitude: 2.0,
    longitude: 12.0,
  };

  test("point at start is 0.0", () => {
    expect(proportionBetweenLatLngs(a, b, a)).toBeCloseTo(0.0);
  });

  test("point at finish is 1.0", () => {
    expect(proportionBetweenLatLngs(a, b, b)).toBeCloseTo(1.0);
  });

  test("point halfway is 0.5", () => {
    const point: LatLng = {
      latitude: 1.5,
      longitude: 11.5,
    };
    expect(proportionBetweenLatLngs(a, b, point)).toBeCloseTo(0.5);
  });

  test("point perpendicular to start is 0.0", () => {
    const point: LatLng = {
      latitude: 0.75,
      longitude: 11.25,
    };
    expect(proportionBetweenLatLngs(a, b, point)).toBeCloseTo(0.0);
  });

  test("point that's not between a and b", () => {
    const point: LatLng = {
      latitude: 1.5,
      longitude: 12.0,
    };
    expect(proportionBetweenLatLngs(a, b, point)).toBeCloseTo(0.75);
  });
});
