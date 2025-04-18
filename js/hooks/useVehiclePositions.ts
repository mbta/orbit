import { useChannel } from "../contexts/socketContext";
import { z } from "zod";

const parser = (data: unknown): { data: string } => {
  return RawData.parse(data);
};

const RawData = z.object({
  data: z.string(),
});
export const useVehiclePositions = (): string => {
  const result = useChannel({
    actuallyConnect: true,
    topic: "train_locations",
    parser,
    event: "vehicle_positions",
    RawData,
    defaultResult: { data: "Haven't received any yet" },
  });

  return JSON.stringify(result);
};
