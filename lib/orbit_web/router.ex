defmodule OrbitWeb.Router do
  use OrbitWeb, :router

  pipeline :browser do
    plug :fetch_session
    plug :fetch_live_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers, %{"content-security-policy" => "default-src 'self'"}
  end

  pipeline :accepts_html do
    plug :accepts, ["html"]
    plug :put_root_layout, html: {OrbitWeb.Layouts, :root}
    # assigns used in the root layout
    plug :merge_assigns, release: Application.compile_env!(:orbit, :release)
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", OrbitWeb do
    pipe_through :browser
    pipe_through :accepts_html

    # Routes that should be handled by React
    # Avoid using a wildcard to prevent invalid 200 responses
    get "/", ReactAppController, :home
    get "/help", ReactAppController, :home
  end

  scope "/", OrbitWeb do
    # no pipe
    get "/_health", HealthController, :index
    get "/_health_db", HealthDbController, :index
  end

  # Enable LiveDashboard in development
  if Application.compile_env(:orbit, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser
      pipe_through :accepts_html

      live_dashboard "/dashboard", metrics: OrbitWeb.Telemetry
    end
  end
end
