defmodule Realtime.Data.Stations do
  @spec platforms_to_stations :: %{required(String.t()) => String.t()}
  def platforms_to_stations do
    %{
      # generally the pattern is southbound platform followed by northbound platform for stations listed twice
      # there are exceptions like Alewife which has a general stop_id and also child ids for the different tracks
      "Alewife-01" => "place-alfcl",
      "Alewife-02" => "place-alfcl",
      "70061" => "place-alfcl",
      "70063" => "place-davis",
      "70064" => "place-davis",
      "70065" => "place-portr",
      "70066" => "place-portr",
      "70067" => "place-harsq",
      "70068" => "place-harsq",
      "70069" => "place-cntsq",
      "70070" => "place-cntsq",
      "70071" => "place-knncl",
      "70072" => "place-knncl",
      "70073" => "place-chmnl",
      "70074" => "place-chmnl",
      "70075" => "place-pktrm",
      "70076" => "place-pktrm",
      "70077" => "place-dwnxg",
      "70078" => "place-dwnxg",
      "70079" => "place-sstat",
      "70080" => "place-sstat",
      "70081" => "place-brdwy",
      "70082" => "place-brdwy",
      "70083" => "place-andrw",
      "70084" => "place-andrw",
      # Red line Ashmont branch
      "70085" => "place-jfk",
      "70086" => "place-jfk",
      "70087" => "place-shmnl",
      "70088" => "place-shmnl",
      "70089" => "place-fldcr",
      "70090" => "place-fldcr",
      "70091" => "place-smmnl",
      "70092" => "place-smmnl",
      "70093" => "place-asmnl",
      "70094" => "place-asmnl",
      # Red line Braintree branch
      "70095" => "place-jfk",
      "70096" => "place-jfk",
      "70097" => "place-nqncy",
      "70098" => "place-nqncy",
      "70099" => "place-wlsta",
      "70100" => "place-wlsta",
      "70101" => "place-qnctr",
      "70102" => "place-qnctr",
      "70103" => "place-qamnl",
      "70104" => "place-qamnl",
      "70105" => "place-brntn",
      "Braintree-01" => "place-brntn",
      "Braintree-02" => "place-brntn"
    }
  end

  @spec next_stations(String.t() | nil, integer()) :: [String.t()]
  def next_stations(station_id, direction) do
    case {station_id, direction} do
      # Southbound

      {"place-alfcl", 0} -> ["place-davis"]
      {"place-davis", 0} -> ["place-portr"]
      {"place-portr", 0} -> ["place-harsq"]
      {"place-harsq", 0} -> ["place-cntsq"]
      {"place-cntsq", 0} -> ["place-knncl"]
      {"place-knncl", 0} -> ["place-chmnl"]
      {"place-chmnl", 0} -> ["place-pktrm"]
      {"place-pktrm", 0} -> ["place-dwnxg"]
      {"place-dwnxg", 0} -> ["place-sstat"]
      {"place-sstat", 0} -> ["place-brdwy"]
      {"place-brdwy", 0} -> ["place-andrw"]
      {"place-andrw", 0} -> ["place-jfk"]
      {"place-jfk", 0} -> ["place-shmnl", "place-nqncy"]
      {"place-shmnl", 0} -> ["place-fldcr"]
      {"place-fldcr", 0} -> ["place-smmnl"]
      {"place-smmnl", 0} -> ["place-asmnl"]
      {"place-asmnl", 0} -> []
      {"place-nqncy", 0} -> ["place-wlsta"]
      {"place-wlsta", 0} -> ["place-qnctr"]
      {"place-qnctr", 0} -> ["place-qamnl"]
      {"place-qamnl", 0} -> ["place-brntn"]
      {"place-brntn", 0} -> []
      # Northbound
      {"place-alfcl", 1} -> []
      {"place-davis", 1} -> ["place-alfcl"]
      {"place-portr", 1} -> ["place-davis"]
      {"place-harsq", 1} -> ["place-portr"]
      {"place-cntsq", 1} -> ["place-harsq"]
      {"place-knncl", 1} -> ["place-cntsq"]
      {"place-chmnl", 1} -> ["place-knncl"]
      {"place-pktrm", 1} -> ["place-chmnl"]
      {"place-dwnxg", 1} -> ["place-pktrm"]
      {"place-sstat", 1} -> ["place-dwnxg"]
      {"place-brdwy", 1} -> ["place-sstat"]
      {"place-andrw", 1} -> ["place-brdwy"]
      {"place-jfk", 1} -> ["place-andrw"]
      {"place-shmnl", 1} -> ["place-jfk"]
      {"place-fldcr", 1} -> ["place-shmnl"]
      {"place-smmnl", 1} -> ["place-fldcr"]
      {"place-asmnl", 1} -> ["place-smmnl"]
      {"place-nqncy", 1} -> ["place-jfk"]
      {"place-wlsta", 1} -> ["place-qnctr"]
      {"place-qnctr", 1} -> ["place-qamnl"]
      {"place-qamnl", 1} -> ["place-brntn"]
      {"place-brntn", 1} -> ["place-qamnl"]
      _ -> []
    end
  end
end
