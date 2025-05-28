import { dateTimeFromISO } from "../../dateTime";
import { useChannel } from "../../hooks/useChannel";
import { useTripUpdates } from "../../hooks/useTripUpdates";
import { tripUpdateFactory } from "../helpers/factory";
import { renderHook } from "@testing-library/react";

jest.mock("../../hooks/useChannel", () => ({
  __esModule: true,
  useChannel: jest.fn(),
}));
const mockUseChannel = useChannel as jest.MockedFunction<typeof useChannel>;

describe("useTripUpdates", () => {
  beforeAll(() => {
    mockUseChannel.mockReturnValue({
      data: [],
    });
  });

  test("subscribes to the proper topic", () => {
    renderHook(useTripUpdates);
    expect(mockUseChannel).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: "trip_updates",
        event: "trip_updates",
      }),
    );
  });

  test("parses a trip update", () => {
    mockUseChannel.mockReturnValue({
      data: [tripUpdateFactory.build()],
    });
    const { result } = renderHook(useTripUpdates);

    expect(result.current).toEqual({
      data: [
        expect.objectContaining({
          label: "1877",
          routeId: "Red",
          timestamp: dateTimeFromISO("2025-04-29T21:27:26.679Z"),
          stopTimeUpdates: [
            expect.objectContaining({
              stationId: "place-brdwy",
            }),
          ],
        }),
      ],
    });
  });
});
