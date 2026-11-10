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
  onSearchMatch,
  onSearchCleared,
  onQueryChange,
}: {
  vehicles: Vehicle[];
  query: string;
  onSearchMatch: (match: VehicleSearchMatch) => boolean;
  onSearchCleared: () => void;
  onQueryChange: (query: string) => void;
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
      setErrorMessage(`⚠️ No trains matched your search`);
      return;
    }

    onSearchMatch(match);
    setErrorMessage(null);
  }, [onSearchCleared, onSearchMatch, query, vehicles]);

  const clearSearch = useCallback(() => {
    onQueryChange("");
    setErrorMessage(null);
    onSearchCleared();
  }, [onSearchCleared, onQueryChange]);

  return (
    <div className="absolute right-10 top-4 z-[10] w-full pl-16 md:pl-0 md:min-w-20 md:max-w-[337px]">
      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          runSearch();
        }}
      >
        <button
          type="submit"
          className="absolute left-2 top-1/2 -translate-y-1/2"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <SearchIcon />
        </button>
        <input
          ref={inputRef}
          className="h-9 w-full rounded-lg pl-8 dark:bg-inputField-search-background-dark light:bg-inputField-search-background-light border border-inputField-search-border-dark px-2 pr-14 text-sm text-white placeholder:text-white"
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
            onQueryChange(event.target.value);
          }}
        />

        {query !== "" ?
          <button
            type="button"
            className="absolute size-8 right-1 top-1/2 -translate-y-1/2"
            onClick={(event) => {
              event.stopPropagation();
              clearSearch();
            }}
          >
            <CloseIcon />
          </button>
        : null}
      </form>

      {errorMessage !== null ?
        <p className="mt-1 rounded px-2 py-1 text-sm text-ladder-text-primary-light dark:text-ladder-text-primary-dark">
          {errorMessage}
        </p>
      : null}
    </div>
  );
};

// TODO: Set up a reusable way to embed svg icons
const CloseIcon = () => {
  const title = "Clear search";
  return (
    <svg
      id="icon--close"
      viewBox="0 0 26 27"
      xmlns="http://www.w3.org/2000/svg"
      className="inline size-4 p-0.5 rounded-full bg-gray-200 dark:fill-inputField-search-background-dark light:fill-inputField-search-background-light"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path d="M16.324 13.704l9.015 9.076a2.377 2.377 0 0 1 0 3.345 2.339 2.339 0 0 1-3.323 0l-9.015-9.075-9.015 9.075a2.339 2.339 0 0 1-3.323 0 2.377 2.377 0 0 1 0-3.345l9.015-9.076L.663 4.63a2.377 2.377 0 0 1 0-3.345 2.339 2.339 0 0 1 3.323 0l9.015 9.075 9.015-9.075a2.339 2.339 0 0 1 3.323 0 2.377 2.377 0 0 1 0 3.345l-9.015 9.075z" />
    </svg>
  );
};

const SearchIcon = () => {
  const title = "Search";
  return (
    <svg
      viewBox="0 0 640 640"
      xmlns="http://www.w3.org/2000/svg"
      className="size-4 fill-gray-200"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z" />
    </svg>
  );
};
