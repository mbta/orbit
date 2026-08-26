defmodule Orbit.Ocs.Utilities.Stations do
  @type station_definition :: %{gtfs_id: String.t() | nil, revenue: boolean()}
  @stations %{
    # RL
    "ALEWIFE YARD" => %{gtfs_id: nil, revenue: false},
    "ALEWIFE" => %{gtfs_id: "place-alfcl", revenue: true},
    "DAVIS SQUARE" => %{gtfs_id: "place-davis", revenue: true},
    "PORTER SQUARE" => %{gtfs_id: "place-portr", revenue: true},
    "HARVARD SQUARE" => %{gtfs_id: "place-harsq", revenue: true},
    "CENTRAL SQUARE" => %{gtfs_id: "place-cntsq", revenue: true},
    "KENDALL/MIT" => %{gtfs_id: "place-knncl", revenue: true},
    "CHARLES/MGH" => %{gtfs_id: "place-chmnl", revenue: true},
    "PARK STREET [R]" => %{gtfs_id: "place-pktrm", revenue: true},
    "DOWNTOWN CROSSING R" => %{gtfs_id: "place-dwnxg", revenue: true},
    "SOUTH STATION" => %{gtfs_id: "place-sstat", revenue: true},
    "BROADWAY" => %{gtfs_id: "place-brdwy", revenue: true},
    "ANDREW SQUARE" => %{gtfs_id: "place-andrw", revenue: true},
    "CABOT YARD" => %{gtfs_id: nil, revenue: false},
    "JFK/ UMASS ASH" => %{gtfs_id: "place-jfk", revenue: true},
    "SAVIN HILL" => %{gtfs_id: "place-shmnl", revenue: true},
    "FIELDS CORNER" => %{gtfs_id: "place-fldcr", revenue: true},
    "SHAWMUT" => %{gtfs_id: "place-smmnl", revenue: true},
    "ASHMONT" => %{gtfs_id: "place-asmnl", revenue: true},
    "CODMAN YARD" => %{gtfs_id: nil, revenue: false},
    "JFK/ UMASS BRT" => %{gtfs_id: "place-jfk", revenue: true},
    "NORTH QUINCY" => %{gtfs_id: "place-nqncy", revenue: true},
    "WOLLASTON" => %{gtfs_id: "place-wlsta", revenue: true},
    "QUINCY CENTER" => %{gtfs_id: "place-qnctr", revenue: true},
    "QUINCY ADAMS" => %{gtfs_id: "place-qamnl", revenue: true},
    "BRAINTREE" => %{gtfs_id: "place-brntn", revenue: true},
    "BRAINTREE STORAGE" => %{gtfs_id: nil, revenue: false},
    "CADDIGAN YARD" => %{gtfs_id: nil, revenue: false},

    # OL
    "OAK GROVE STORAGE" => %{gtfs_id: nil, revenue: false},
    "OAK GROVE" => %{gtfs_id: "place-ogmnl", revenue: true},
    "MALDEN CENTER" => %{gtfs_id: "place-mlmnl", revenue: true},
    "WELL YARD N" => %{gtfs_id: nil, revenue: false},
    "WELLINGTON" => %{gtfs_id: "place-welln", revenue: true},
    "WELL YARD S" => %{gtfs_id: nil, revenue: false},
    "ASSEMBLY" => %{gtfs_id: "place-astao", revenue: true},
    "SULLIVAN SQUARE" => %{gtfs_id: "place-sull", revenue: true},
    "COMMUNITY COLLEGE" => %{gtfs_id: "place-ccmnl", revenue: true},
    "NORTH STATION" => %{gtfs_id: "place-north", revenue: true},
    "HAYMARKET" => %{gtfs_id: "place-haecl", revenue: true},
    "STATE STREET" => %{gtfs_id: "place-state", revenue: true},
    "DOWNTOWN CROSSING" => %{gtfs_id: "place-dwnxg", revenue: true},
    "CHINATOWN" => %{gtfs_id: "place-chncl", revenue: true},
    "TUFTS MEDICAL CTR" => %{gtfs_id: "place-tumnl", revenue: true},
    "BACK BAY/SOUTH END" => %{gtfs_id: "place-bbsta", revenue: true},
    "MASS AVE" => %{gtfs_id: "place-masta", revenue: true},
    "RUGGLES" => %{gtfs_id: "place-rugg", revenue: true},
    "ROXBURY CROSSING" => %{gtfs_id: "place-rcmnl", revenue: true},
    "JACKSON SQUARE" => %{gtfs_id: "place-jaksn", revenue: true},
    "STONY BROOK" => %{gtfs_id: "place-sbmnl", revenue: true},
    "GREEN STREET" => %{gtfs_id: "place-grnst", revenue: true},
    "FOREST HILLS" => %{gtfs_id: "place-forhl", revenue: true},
    "FOREST HILLS YARD" => %{gtfs_id: nil, revenue: false},

    # BL
    "WONDERLAND YARD" => %{gtfs_id: nil, revenue: false},
    "WONDERLAND" => %{gtfs_id: "place-wondl", revenue: true},
    "REVERE BEACH" => %{gtfs_id: "place-rbmnl", revenue: true},
    "BEACHMONT" => %{gtfs_id: "place-bmmnl", revenue: true},
    "SUFFOLK DOWNS" => %{gtfs_id: "place-sdmnl", revenue: true},
    "ORIENT HEIGHTS YARD" => %{gtfs_id: nil, revenue: false},
    "ORIENT HEIGHTS" => %{gtfs_id: "place-orhte", revenue: true},
    "WOOD ISLAND" => %{gtfs_id: "place-wimnl", revenue: true},
    "AIRPORT" => %{gtfs_id: "place-aport", revenue: true},
    "MAVERICK SQUARE" => %{gtfs_id: "place-mvbcl", revenue: true},
    "AQUARIUM" => %{gtfs_id: "place-aqucl", revenue: true},
    "STATE STREET [B]" => %{gtfs_id: "place-state", revenue: true},
    "GOVERNMENT CENTER" => %{gtfs_id: "place-gover", revenue: true},
    "BOWDOIN" => %{gtfs_id: "place-bomnl", revenue: true},
    "BOWDOIN STORAGE" => %{gtfs_id: nil, revenue: false}
  }

  defp stations, do: @stations

  @spec ocs_to_gtfs(String.t() | nil) :: String.t() | nil
  def ocs_to_gtfs(nil), do: nil

  def ocs_to_gtfs(ocs_station_id) do
    get_in(stations(), [ocs_station_id, :gtfs_id])
  end

  @spec revenue?(String.t() | nil) :: boolean()
  def revenue?(nil), do: false

  def revenue?(ocs_station_id) do
    get_in(stations(), [ocs_station_id, :revenue])
  end
end
