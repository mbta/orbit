defmodule CertTest do
  require Logger

  def test_client_requests do
    # Request that chains to compromised cert: emSign Root TLS CA - G3
    test_url = "https://ov-g3b-emudhra.we-have-a-problem.com/?t=1792621266006"

    case Req.get(test_url) do
      {:ok, response} -> Logger.info("cert_test req ok response=#{inspect(response)}")
      {:error, exception} -> Logger.error("cert_test req error response=#{inspect(exception)}")
    end

    case Finch.build(:get, test_url) |> Finch.request(FinchTestClient) do
      {:ok, response} -> Logger.info("cert_test finch ok response=#{inspect(response)}")
      {:error, error} -> Logger.error("cert_test finch error response=#{inspect(error)}")
    end
  end
end
