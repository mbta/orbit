defmodule OrbitWeb.Router do
  use OrbitWeb, :router

  pipeline :browser do
    if Application.compile_env(:orbit, :force_https?) do
      plug(Plug.SSL,
        rewrite_on: [:x_forwarded_proto],
        host: {System, :get_env, ["PHX_HOST"]}
      )
    end

    plug :fetch_session
    plug :fetch_live_flash
    plug :protect_from_forgery

    plug :put_secure_browser_headers, %{
      # much of this is necessary for Appcues: https://docs.appcues.com/user-experiences-faq/faq-content-security-policies
      # script-src-elem 'unsafe-inline' is for react developer tools
      "content-security-policy" => "\
        connect-src 'self' *.sentry.io *.fullstory.com https://*.appcues.com https://*.appcues.net wss://*.appcues.net wss://*.appcues.com;\
        default-src 'self';\
        font-src 'self' https://fonts.gstatic.com;\
        frame-src 'self' https://*.appcues.com;\
        img-src 'self' https://*.appcues.com https://*.appcues.net res.cloudinary.com cdn.jsdelivr.net;\
        script-src 'self' *.fullstory.com https://*.appcues.com https://*.appcues.net;\
        script-src-elem 'self' *.fullstory.com https://*.appcues.com https://*.appcues.net 'unsafe-inline';\
        style-src 'self' https://*.appcues.com https://*.appcues.net https://fonts.googleapis.com https://fonts.google.com 'unsafe-inline';\
        "
    }
  end

  pipeline :accepts_html do
    plug :browser
    plug :accepts, ["html"]
    plug :put_root_layout, html: {OrbitWeb.Layouts, :root}
    # assigns used in the root layout
    plug :merge_assigns, release: Application.compile_env!(:orbit, :release)
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :authenticated do
    plug(OrbitWeb.Auth.Guardian.Pipeline)
    plug(OrbitWeb.Plugs.RequireLogin)
  end

  pipeline :require_group_orbit_bl_ffd do
    plug(OrbitWeb.Plugs.RequireGroup, [
      OrbitWeb.Auth.Groups.orbit_bl_ffd(),
      OrbitWeb.Auth.Groups.orbit_tid_staff()
    ])
  end

  pipeline :require_group_orbit_tid_staff do
    plug(OrbitWeb.Plugs.RequireGroup, [
      OrbitWeb.Auth.Groups.orbit_tid_staff()
    ])
  end

  scope "/", OrbitWeb do
    pipe_through :accepts_html

    get("/login", AuthController, :login_page)
    get("/auth/:provider", AuthController, :request)
    get("/auth/:provider/callback", AuthController, :callback)
  end

  scope "/", OrbitWeb do
    pipe_through :accepts_html
    pipe_through :authenticated

    # Routes that should be handled by React
    # Avoid using a wildcard to prevent invalid 200 responses
    # note: the front-end routes check user groups provided via <meta> tags
    get "/", ReactAppController, :home
    get "/landing", ReactAppController, :home
    get "/menu", ReactAppController, :home
    get "/operators", ReactAppController, :home
    get "/ladder", ReactAppController, :home
    get "/help", ReactAppController, :home
    get "/logout", AuthController, :logout

    get "/sign-in-export/:filename", SignInExportController, :get
    get "/sign-in-export", SignInExportController, :get_redirect
  end

  scope "/", OrbitWeb do
    pipe_through :browser
    pipe_through :api
    pipe_through :authenticated
    pipe_through :require_group_orbit_bl_ffd

    get "/api/employees", EmployeesController, :index
    get "/api/certifications", CertificationsController, :index
    get "/api/rfid", RfidController, :show
    get "/api/signin", SignInController, :index
    post "/api/signin", SignInController, :submit
  end

  scope "/", OrbitWeb do
    pipe_through :accepts_html
    pipe_through :authenticated

    get "/admin/employee", Admin.AdminController, :get_employee
    post "/admin/employee", Admin.AdminController, :post_employee
    delete "/admin/employee", Admin.AdminController, :delete_employee
    get "/admin/rfid", Admin.AdminController, :get_rfid
    post "/admin/rfid", Admin.AdminController, :post_rfid
    delete "/admin/rfid", Admin.AdminController, :delete_rfid
  end

  scope "/", OrbitWeb do
    pipe_through :accepts_html
    pipe_through :authenticated
    pipe_through :require_group_orbit_tid_staff

    get "/ocs/trips", OcsController, :trips
    get "/ocs/trains", OcsController, :trains
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
      pipe_through :accepts_html
      pipe_through :authenticated

      live_dashboard "/dashboard", metrics: OrbitWeb.Telemetry
    end
  end
end
