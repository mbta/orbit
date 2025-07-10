import { CarId, DirectionId, RouteId } from "../models/common";

export const remapTrainLabels = (cars: CarId[]) => {
  return cars.map((car) => {
    return car.startsWith("15") ? "2" + car.slice(1) : car;
  });
};

export const reorderAndRemap = (
  label: CarId,
  consist: CarId[],
  direction_id: DirectionId,
  route_id?: RouteId | null,
) => {
  const expectedLeadIndex = direction_id === 0 ? 0 : consist.length - 1;
  const expectedLastIndex = direction_id === 0 ? consist.length - 1 : 0;

  let processedConsist = [];
  if (label === consist[expectedLeadIndex]) {
    processedConsist = consist;
  } else if (label === consist[expectedLastIndex]) {
    processedConsist = [...consist].reverse();
  } else {
    console.error(
      `vehicle label ${label} is not the lead car in consist`,
      consist,
    );
    return consist;
  }
  return route_id === "Red" ?
      remapTrainLabels(processedConsist)
    : processedConsist;
};
