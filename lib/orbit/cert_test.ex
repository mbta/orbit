defmodule CertTest do
  require Logger

  def test_client_requests do
    # Request that chains to compromised cert: emSign Root TLS CA - G3
    test_host = "ov-g3b-emudhra.we-have-a-problem.com"
    test_path = "/?t=1792621266006"
    test_url = "https://#{test_host}#{test_path}"

    case Req.get(test_url) do
      {:ok, response} -> Logger.info("cert_test req ok response=#{inspect(response)}")
      {:error, exception} -> Logger.error("cert_test req error response=#{inspect(exception)}")
    end

    case Finch.build(:get, test_url) |> Finch.request(FinchTestClient) do
      {:ok, response} -> Logger.info("cert_test finch ok response=#{inspect(response)}")
      {:error, error} -> Logger.error("cert_test finch error response=#{inspect(error)}")
    end

    with {:ok, conn} <- Mint.HTTP.connect(:https, test_host, 443),
         {:ok, conn, _request_ref} <- Mint.HTTP.request(conn, "GET", test_path, [], "") do
      receive do
        message ->
          case Mint.HTTP.stream(conn, message) do
            {:ok, _conn, responses} ->
              Logger.info("cert_test mint ok response=#{inspect(responses)}")

            {:error, _conn, error, _responses} ->
              Logger.error("cert_test mint error response=#{inspect(error)}")

            :unknown ->
              Logger.error("cert_test mint unknown")
          end
      after
        5_000 -> Logger.error("cert_test mint timeout")
      end
    else
      {:error, error} -> Logger.error("cert_test mint error error=#{inspect(error)}")
      {:error, _conn, error} -> Logger.error("cert_test mint error error=#{inspect(error)}")
    end

    case HTTPoison.get(test_url) do
      {:ok, response} ->
        Logger.info("cert_test httpoison ok response=#{inspect(response)}")

      {_, error} ->
        Logger.error("cert_test httpoison error error=#{inspect(error)}")
    end
  end
end
