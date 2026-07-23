import { CarId, RouteId } from "../../models/common";
import { Vehicle } from "../../models/vehicle";
import { remapLabel } from "../../util/consist";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";

export type VehicleSearchMatch = {
  vehicle: Vehicle;
  matchedCar: CarId;
};

const searchableValuesForCar = (car: CarId, routeId: RouteId): Set<string> => {
  const remappedCar = remapLabel(car, routeId);
  const values = new Set<string>([car, remappedCar]);

  if (car.length === 4) {
    values.add(car.slice(1));
  }

  if (remappedCar.length === 4) {
    values.add(remappedCar.slice(1));
  }
  return values;
};

const findVehicleMatch = (
  vehicles: Vehicle[],
  search: string,
): VehicleSearchMatch | null => {
  for (const vehicle of vehicles) {
    for (const car of vehicle.vehiclePosition.cars) {
      const searchableValues = searchableValuesForCar(
        car,
        vehicle.vehiclePosition.routeId,
      );
      if (searchableValues.has(search)) {
        return {
          vehicle,
          matchedCar: car,
        };
      }
    }
  }

  return null;
};

export const SearchBar = ({
  vehicles,
  query,
  setQuery,
  onSearchMatch,
  onSearchCleared,
}: {
  vehicles: Vehicle[];
  query: string;
  setQuery: (query: string) => void;
  onSearchMatch: (match: VehicleSearchMatch) => boolean;
  onSearchCleared: () => void;
}): ReactElement => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query === "") {
      setErrorMessage(null);
    }
  }, [query]);

  const runSearch = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed === "") {
      return;
    }

    inputRef.current?.blur();

    const match = findVehicleMatch(vehicles, trimmed);
    if (match === null) {
      onSearchCleared();
      setErrorMessage(`⚠️ No search results for "${trimmed}"`);
      return;
    }

    onSearchMatch(match);
    setErrorMessage(null);
  }, [onSearchCleared, onSearchMatch, query, vehicles]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setErrorMessage(null);
    onSearchCleared();
  }, [onSearchCleared, setQuery]);

  return (
    <div className="absolute right-10 top-16 z-object min-w-20 max-w-[337px]">
      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          runSearch();
        }}
      >
        <button
          type="submit"
          aria-label="Search for car"
          className="absolute left-2 top-1/2 -translate-y-1/2"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <img
            src="/images/magnifying-glass.svg"
            alt={""}
            className="h-4 w-4"
          />
        </button>
        <input
          ref={inputRef}
          className="h-9 w-full rounded pl-8 border border-gray-300 px-2 pr-14 text-sm text-black"
          placeholder="Car #"
          type="text"
          maxLength={4}
          value={query}
          onFocus={() => {
            setErrorMessage(null);
          }}
          onClick={(event) => {
            event.stopPropagation();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />

        {query !== "" ?
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            onClick={(event) => {
              event.stopPropagation();
              clearSearch();
            }}
          >
            ×
          </button>
        : null}
      </form>

      {errorMessage !== null ?
        <p className="mt-1 rounded bg-white px-2 py-1 text-sm text-red-600">
          {errorMessage}
        </p>
      : null}
    </div>
  );
};
