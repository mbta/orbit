import { CarId, DirectionId, RouteId } from "../models/common";

export const remapLabel = (car: CarId, routeId: RouteId) => {
  return routeId === "Red" && car.startsWith("15") ? "2" + car.slice(1) : car;
};

export const remapLabels = (cars: CarId[], routeId: RouteId) => {
  return cars.map((car) => remapLabel(car, routeId));
};

export const reorder = (
  label: CarId,
  consist: CarId[],
  direction_id: DirectionId,
) => {
  const expectedLeadIndex = direction_id === 0 ? 0 : consist.length - 1;
  const expectedLastIndex = direction_id === 0 ? consist.length - 1 : 0;

  if (label === consist[expectedLeadIndex]) {
    return consist;
  } else if (label === consist[expectedLastIndex]) {
    return [...consist].reverse();
  } else {
    console.error(
      `vehicle label ${label} is not the lead car in consist`,
      consist,
    );
    return consist;
  }
};
