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
end
