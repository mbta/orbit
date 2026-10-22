defmodule CertTest do
  require Logger

  # Request that chains to compromised cert: emSign Root TLS CA - G3
  defp test_host, do: "ov-g3b-emudhra.we-have-a-problem.com"
  defp test_path, do: "/?t=1792621266006"
  defp test_url, do: "https://#{test_host()}#{test_path()}"

  @spec test_client_requests() :: :ok
  def test_client_requests do
    [
      :req,
      :finch,
      :mint
    ]
    |> Enum.each(&test/1)
  end

  defp test(:req) do
    case Req.get(test_url()) do
      {:ok, response} -> Logger.info("cert_test req ok response=#{inspect(response)}")
      {:error, exception} -> Logger.error("cert_test req error response=#{inspect(exception)}")
    end
  end

  defp test(:finch) do
    case Finch.build(:get, test_url()) |> Finch.request(FinchTestClient) do
      {:ok, response} -> Logger.info("cert_test finch ok response=#{inspect(response)}")
      {:error, error} -> Logger.error("cert_test finch error response=#{inspect(error)}")
    end
  end

  defp test(:mint) do
    with {:ok, conn} <- Mint.HTTP.connect(:https, test_host(), 443),
         {:ok, conn, _request_ref} <- Mint.HTTP.request(conn, "GET", test_path(), [], "") do
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
  end
end
