defmodule OrbitWeb.CrashController do
  use OrbitWeb, :controller

  def crash(_conn, _params) do
    raise "Test Exception"
  end
end
