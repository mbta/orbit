import { formatStationName, gtfsIdToDisplayName } from "../../data/stations";
import { dateTimeFormat } from "../../dateTime";
import { CarId } from "../../models/common";
import { estimatedArrival } from "../../models/tripUpdate";
import { lateForNext, latestOcsUpdatedAt, Vehicle } from "../../models/vehicle";
import { StopStatus } from "../../models/vehiclePosition";
import { getColorSchemeSetting } from "../../util/colorScheme";
import { remapLabels, reorder } from "../../util/consist";
import { className } from "../../util/dom";
import { isFeatureEnabled } from "../../util/featureFlags";
import { themeForVehicleRoute } from "./ladder";
import { TrainThemes } from "./trainTheme";
import { DateTime } from "luxon";
import { ReactElement, useState } from "react";

export type SideBarSelection = {
  vehicle: Vehicle;
  searchedCar?: CarId | null;
};

export const SideBar = ({
  selection,
  close,
}: {
  selection: SideBarSelection;
  close: () => void;
}): ReactElement => {
  const colorScheme = getColorSchemeSetting();

  return (
    <aside className="sm:min-w-[320px] z-[20] sticky flex flex-col left-0 sm:w-80 light:bg-drawer-background-light light:text-text-primary-light dark:bg-drawer-background-dark dark:text-text-primary-dark transition-transform duration-300 ease-in-out animate-slide-in-from-left">
      <Header vehicle={selection.vehicle} />
      <button
        className="absolute m-3 pt-2 top-0 right-0 h-4 w-4 hover:fill-slate-700"
        onClick={close}
      >
        <img
          src="/images/close.svg"
          alt="Close"
          style={{
            filter: colorScheme === "light" ? "invert(0.4)" : "invert(1)",
          }}
        />
      </button>
      <div className="h-full w-screen sm:w-auto">
        <CurrentLocation vehicle={selection.vehicle} />
        <CurrentTrip vehicle={selection.vehicle} />
        <Consist
          vehicle={selection.vehicle}
          searchedCar={selection.searchedCar ?? null}
        />
        <NextTrip vehicle={selection.vehicle} />
        {isFeatureEnabled("ladder_sidebar_export") ?
          <VehicleCopyButton
            key={selection.vehicle.vehiclePosition.vehicleId}
            vehicle={selection.vehicle}
          />
        : null}
      </div>
      <LastOcsUpdated vehicle={selection.vehicle} />
    </aside>
  );
};

const processVehicleConsist = (
  vehicle: Vehicle,
): {
  consist: CarId[];
  processedConsist: CarId[];
  leadCarIndex: number;
} => {
  const vp = vehicle.vehiclePosition;
  const consist: CarId[] = reorder(vp.label, vp.cars, vp.directionId);
  const processedConsist = remapLabels(consist, vp.routeId);
  const leadCarIndex = vp.directionId === 0 ? 0 : vp.cars.length - 1;
  return { consist, processedConsist, leadCarIndex };
};

const Header = ({ vehicle }: { vehicle: Vehicle }) => {
  const { processedConsist, leadCarIndex } = processVehicleConsist(vehicle);
  const current = vehicle.ocsTrips.current;

  // TODO: fallbacks to braintree theme... better alternative?
  // somehow provide ladderConfig to perform full themeForVehicleOnLadder() with fallbacks?
  // extract the branch/route from just the vehicle above?
  const theme = themeForVehicleRoute(vehicle) ?? TrainThemes.braintree;
  return (
    <section className="pb-3 border-b-2 light:border-drawer-border-light dark:border-drawer-border-dark">
      <div className={className([theme.backgroundColor, "h-2 w-full"])} />
      <div className="px-4 pt-2 text-md">
        <div className="flex items-center gap-2">
          <span
            className={className([
              "flex items-center justify-center w-6 h-6 rounded-full font-bold text-base light:text-white dark:text-slate-800",
              theme.backgroundColor,
            ])}
          >
            {theme === TrainThemes.ashmont ? "A" : "B"}
          </span>
          <div>{processedConsist[leadCarIndex]}</div>
        </div>
        <div>
          {current?.scheduledDeparture ?
            dateTimeFormat(current.scheduledDeparture, "service")
          : "---"}{" "}
          <Offset value={vehicle.ocsTrips.current?.offset} />
          Sched
        </div>
      </div>
    </section>
  );
};

const Consist = ({
  vehicle,
  searchedCar,
}: {
  vehicle: Vehicle;
  searchedCar: CarId | null;
}) => {
  const { consist, processedConsist, leadCarIndex } =
    processVehicleConsist(vehicle);
  return (
    <section className="mt-3 mx-2 flex flex-col rounded-lg overflow-hidden border light:border-card-border-light dark:border-card-border-dark">
      <div className="light:bg-card-header-light dark:bg-card-header-dark">
        <h2 className="mx-3 text-xs">Cars</h2>
      </div>
      <div className="light:bg-card-background-light dark:bg-card-background-dark">
        <div className="mt-1 px-3 flex">
          {processedConsist.map((label, index) => {
            const isLeadCar = index === leadCarIndex;
            const isSearchMatch =
              searchedCar !== null && consist[index] === searchedCar;

            return (
              <div
                key={index}
                className={className([
                  "mr-1",
                  isLeadCar ? "font-bold text-2xl" : "pt-1.5",
                  isSearchMatch ? "bg-[#ffdb00]" : "",
                ])}
              >
                {label}
              </div>
            );
          })}
        </div>
        <a
          href={`http://10.198.0.231/Train/sched_trip.php?train=${processedConsist[leadCarIndex]}`}
          className="hidden mt-1 mb-4 w-fit px-6 py-2 md:flex flex-row items-center justify-center gap-2 border light:bg-button-tertiary-background-light light:border-button-tertiary-border-light dark:bg-button-tertiary-background-dark dark:border-button-tertiary-border-dark mx-auto rounded-lg"
        >
          <span
            aria-hidden="true"
            className="h-4 w-4 shrink-0 light:bg-button-tertiary-text-light dark:bg-button-tertiary-text-dark [mask-image:url('/images/network.svg')] [-webkit-mask-image:url('/images/network.svg')] [mask-position:center] [-webkit-mask-position:center] [mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat] [mask-size:contain] [-webkit-mask-size:contain]"
          />
          <span className="light:text-button-tertiary-text-light dark:text-button-tertiary-text-dark text-xs font-bold">
            See Cars&rsquo; History
          </span>
        </a>
      </div>
    </section>
  );
};

const CurrentLocation = ({ vehicle }: { vehicle: Vehicle }) => {
  return (
    <section
      className="mt-3 mx-2 rounded-lg overflow-hidden border light:border-card-border-light dark:border-card-border-dark"
      data-testid="current-location-section"
    >
      <div className="light:bg-card-header-light dark:bg-card-header-dark">
        <h2 className="mx-3 text-xs">Current Location</h2>
      </div>

      <div className="light:bg-card-background-light dark:bg-card-background-dark flex justify-between">
        <div className="flex justify-between mx-3 text-base pt-2 pb-2">
          {vehicle.vehiclePosition.stopStatus === StopStatus.StoppedAt ?
            "Boarding at"
          : "Next stop"}
          &nbsp;
          <span className="font-bold">
            {gtfsIdToDisplayName(vehicle.vehiclePosition.stationId) ?? "---"}
          </span>
        </div>
      </div>
    </section>
  );
};
const StationDisplay = ({
  scheduled,
  updated,
}: {
  scheduled: string | null;
  updated?: string | null;
}) => {
  const scheduledFormatted = formatStationName(scheduled);
  const updatedFormatted = formatStationName(updated);
  return scheduledFormatted && updatedFormatted ?
      <span>
        <span className="line-through">{scheduledFormatted}</span>{" "}
        <span>{updatedFormatted}</span>
      </span>
    : <span>{scheduledFormatted ?? updatedFormatted ?? "---"}</span>;
};

const CurrentTrip = ({ vehicle }: { vehicle: Vehicle }) => {
  const current = vehicle.ocsTrips.current;
  const estArrival: DateTime | null = estimatedArrival(vehicle);

  return (
    <section className="mt-3 mx-2 rounded-lg overflow-hidden border light:border-card-border-light dark:border-card-border-dark">
      <div className="light:bg-card-header-light dark:bg-card-header-dark">
        <h2 className="mx-3 text-xs">Current Trip</h2>
      </div>

      <div className="light:bg-card-background-light dark:bg-card-background-dark flex justify-between pt-1.5 pb-1.5">
        <div className="flex flex-col justify-between mx-2">
          <span>
            {/* Departed {formatStationName(current?.originStation) ?? "---"} */}
            Departed{" "}
            <StationDisplay
              scheduled={current?.originStation ?? null}
              updated={current?.originStationUpdated}
            />
          </span>
          <span className="mt-2">
            Arriving at{" "}
            {/* {formatStationName(current?.destinationStation) ?? "---"} */}
            <StationDisplay
              scheduled={current?.destinationStation ?? null}
              updated={current?.destinationStationUpdated}
            />
          </span>
        </div>
        <div className="flex flex-col justify-between font-bold pr-3">
          <span>
            {current?.actualDeparture ?
              dateTimeFormat(current.actualDeparture, "service")
            : "---"}
          </span>
          <span>
            {estArrival ? dateTimeFormat(estArrival, "service") : "---"}
          </span>
        </div>
      </div>
    </section>
  );
};

const NextTrip = ({ vehicle }: { vehicle: Vehicle }) => {
  const stationsMatch =
    vehicle.ocsTrips.current?.destinationStation ===
    vehicle.ocsTrips.next[0]?.originStation;
  const current = vehicle.ocsTrips.current;

  const next =
    vehicle.ocsTrips.next.length === 0 ? null : vehicle.ocsTrips.next[0];

  const nextDepMin = lateForNext(vehicle);
  const showLateBox = nextDepMin !== null && nextDepMin >= 1;

  return (
    <div className="mt-4 border-t-2 light:border-drawer-border-light dark:border-drawer-border-dark">
      <section
        className="mt-4 mx-2 border light:border-card-border-light dark:border-card-border-dark rounded-lg overflow-hidden"
        data-testid="next-trip-section"
      >
        <div className="">
          <div className="light:bg-card-header-light dark:bg-card-header-dark">
            <h2 className="mx-3 text-xs">Next Trip</h2>
          </div>

          <div className="light:bg-card-background-light dark:bg-card-background-dark">
            <div className="flex pt-1">
              <div className="flex flex-col mx-3 mb-2 justify-between">
                {current && !current.nextUid ?
                  <span>None</span>
                : <>
                    <span className="mb-1">
                      {!stationsMatch ?
                        "--"
                      : `${formatStationName(next?.originStation) ?? "--"} to ${formatStationName(next?.destinationStation) ?? "--"}`}
                    </span>
                    <span>
                      {!stationsMatch ?
                        "--"
                      : next?.scheduledDeparture ?
                        `${dateTimeFormat(next.scheduledDeparture, "service")} Sched`
                      : "--"}
                    </span>
                  </>
                }
              </div>
            </div>
            {showLateBox && (
              <Late
                departedLate={null}
                arrivingLate={nextDepMin}
                arrivingLateText={"next trip's departure time."}
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const Offset = ({ value }: { value: number | null | undefined }) => {
  if (value === null || value == undefined || value === 0) {
    return null;
  }

  return "(" + (value > 0 ? `+${value}` : value.toString()) + ") ";
};

const Late = ({
  // TODO: refactor out if no longer used
  departedLate,
  arrivingLate,
  arrivingLateText,
}: {
  departedLate: number | null;
  arrivingLate: number | null;
  arrivingLateText: string | null;
}) => {
  return (
    <div className="mx-2 light:bg-error-state-warning-bg-light dark:bg-error-state-warning-bg-dark rounded-lg italic p-2">
      <div className="flex">
        <div className="mt-0.5 pr-1.5">
          <span
            aria-hidden="true"
            className="block h-3 w-3 shrink-0 translate-y-0.5 bg-error-state-warning-dark [mask-image:url('/images/warning-triangle.svg')] [-webkit-mask-image:url('/images/warning-triangle.svg')] [mask-position:center] [-webkit-mask-position:center] [mask-repeat:no-repeat] [-webkit-mask-repeat:no-repeat] [mask-size:contain] [-webkit-mask-size:contain]"
          />
        </div>
        <div className="flex-1">
          {departedLate && (
            <p>
              Departed{" "}
              <span className="font-bold">
                {formatDelta(departedLate)} min{" "}
                {departedLate >= 0 ? "late" : "early"}
              </span>
              .
            </p>
          )}
          {arrivingLate && (
            <p>
              Arriving{" "}
              <span className="font-bold">
                {formatDelta(arrivingLate)} min{" "}
                {arrivingLate >= 0 ? "later" : "earlier"}
              </span>{" "}
              than {arrivingLateText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const formatDelta = (min: number) => {
  return Math.abs(Math.floor(min));
};

const VehicleCopyButton = ({ vehicle }: { vehicle: Vehicle }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = (vehicle: Vehicle) => {
    const data = {
      copiedAt: new Date().toISOString(),
      vehicle,
    };
    const json = JSON.stringify(data, null, 4);
    // We use `void` operator here to explicitly ignore the result of the
    // writeText promise.
    void window.navigator.clipboard.writeText(json);
    setCopied(true);
  };

  return (
    <button
      className="absolute mb-6 mr-5 bottom-0 right-0 h-6 w-6 hover:fill-slate-700"
      title="Copy vehicle data (debug)"
      onClick={() => {
        onCopy(vehicle);
      }}
    >
      <img
        className="m-1 h-6 w-6 transition-opacity"
        src={
          copied ?
            "/images/clipboard-green-check.svg"
          : "/images/clipboard-gray.svg"
        }
        alt="Copy vehicle data (debug)"
      />
    </button>
  );
};

const LastOcsUpdated = ({ vehicle }: { vehicle: Vehicle }) => {
  const updatedAt = latestOcsUpdatedAt(vehicle);
  if (updatedAt !== null) {
    return (
      <div className="mb-6 ml-5">
        <span className="text-gray-400 text-xs italic">
          {`Last updated from OCS trainsheets at ${dateTimeFormat(updatedAt, "wall")}`}
        </span>
      </div>
    );
  }
  return null;
};
