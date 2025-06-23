defmodule Orbit.PersistentState do
  require Logger

  defmacro __using__(
             state_filename: state_filename,
             new_state: new_state,
             restore_fn: restore_fn,
             current_version: current_version
           ) do
    quote do
      require Logger

      def init_persistent_state(opts) do
        Process.flag(:trap_exit, true)
        Orbit.PersistentState.state_write(self(), opts[:save_state_time])

        Orbit.PersistentState.init_persistent_state(
          unquote(state_filename),
          unquote(new_state),
          unquote(restore_fn),
          unquote(current_version),
          __MODULE__
        )
      end

      @impl true
      def handle_info({:write, time}, state) do
        Orbit.PersistentState.state_write(self(), time)

        Orbit.PersistentState.write_to_disk(
          unquote(state_filename),
          state,
          unquote(current_version)
        )

        Task.Supervisor.start_child(Orbit.PersistentState.S3WriterSupervisor, fn ->
          Orbit.PersistentState.write_to_s3(
            unquote(state_filename),
            state,
            unquote(current_version)
          )
        end)

        if Map.has_key?(state, :is_broadway), do: {:noreply, [], state}, else: {:noreply, state}
      end

      @impl true
      def terminate(reason, state) do
        Logger.info("Exiting for reason: #{inspect(reason)}. Writing persistent state.")

        Orbit.PersistentState.write_to_disk(
          unquote(state_filename),
          state,
          unquote(current_version)
        )

        s3_uploader_task =
          Task.Supervisor.async_nolink(Orbit.PersistentState.S3WriterSupervisor, fn ->
            Orbit.PersistentState.write_to_s3(
              unquote(state_filename),
              state,
              unquote(current_version)
            )
          end)

        Task.await(s3_uploader_task)
      end

      def remove_state_from_disk do
        Orbit.PersistentState.remove_state_from_disk(unquote(state_filename))
      end
    end
  end

  @spec init_persistent_state(
          String.t(),
          any(),
          (term, non_neg_integer, non_neg_integer -> {:ok, any()} | :error),
          non_neg_integer,
          module()
        ) ::
          {:ok, any()}
  def init_persistent_state(
        state_filename,
        new_state,
        restore_fn,
        current_version,
        module
      ) do
    {:ok, load_state?} = Application.fetch_env(:orbit, :load_state?)
    {:ok, directory} = Application.fetch_env(:orbit, :persistent_state_dir)
    {:ok, get_state_s3} = Application.fetch_env(:orbit, :get_state_from_s3?)
    File.mkdir_p(directory)

    if get_state_s3, do: download_persistent_state(state_filename)

    do_init_persistent_state(
      state_filename,
      new_state,
      restore_fn,
      current_version,
      module,
      directory,
      load_state? == "true"
    )
  end

  @spec download_persistent_state(String.t()) :: :ok | {:error, any()}
  defp download_persistent_state(state_filename) do
    bucket = Application.get_env(:orbit, :s3_state_bucket)

    filename =
      :orbit |> Application.get_env(:persistent_state_dir) |> Path.join(state_filename)

    s3_downloader = Application.get_env(:orbit, :s3_downloader)
    aws_operation = Application.get_env(:orbit, :aws_operation)
    dl = s3_downloader.download_file(bucket, state_filename, filename)

    try do
      {:ok, :done} = aws_operation.perform(dl, [])
      Logger.info("Downloaded #{state_filename} from S3 bucket=#{bucket}")
    rescue
      e ->
        Logger.warning(
          "event=persistent_state_issue Failed to download #{state_filename} from S3 bucket #{bucket} with issue: #{inspect(e)}"
        )
    end
  end

  @spec do_init_persistent_state(
          Path.t(),
          any(),
          (term, non_neg_integer, non_neg_integer -> {:ok, any()} | :error),
          non_neg_integer,
          module(),
          Path.t(),
          boolean()
        ) :: {:ok, term()}
  defp do_init_persistent_state(
         state_filename,
         new_state,
         restore_fn,
         current_version,
         module,
         directory,
         true
       ) do
    with {:ok, binary} <- directory |> Path.join(state_filename) |> File.read(),
         {:ok, state} <- safe_parse(restore_fn, current_version, binary) do
      Logger.info("Loaded #{inspect(module)} from disk")
      {:ok, state}
    else
      _ ->
        Logger.warning(
          "event=persistent_state_init_issue Failed to load #{inspect(module)} state"
        )

        {:ok, new_state}
    end
  end

  defp do_init_persistent_state(
         _state_filename,
         new_state,
         _restore_fn,
         _current_version,
         module,
         _directory,
         _load_state?
       ) do
    Logger.info("Not loading #{inspect(module)} state from disk")
    {:ok, new_state}
  end

  @spec write_to_disk(String.t(), any, non_neg_integer) :: :ok | :error
  def write_to_disk(state_filename, state, current_version) do
    filename = :orbit |> Application.get_env(:persistent_state_dir) |> Path.join(state_filename)
    binary = serialize(state, current_version)

    case File.write(filename, binary) do
      :ok ->
        :ok

      _ ->
        Logger.warning(
          "event=persistent_state_disk_write_error Could not save state to #{filename}"
        )

        :error
    end
  end

  @spec write_to_s3(String.t(), any, non_neg_integer) :: :ok | :error
  def write_to_s3(state_filename, state, current_version) do
    binary = serialize(state, current_version)
    bucket = Application.get_env(:orbit, :s3_state_bucket)

    # TODO: Replace this with Orbit.S3 calls
    case bucket
         |> ExAws.S3.put_object(state_filename, binary)
         |> Application.get_env(:orbit, :s3_requestor).request do
      {:ok, _} ->
        :ok

      _ ->
        Logger.warning(
          "event=persistent_state_s3_write_issues state_filename=#{state_filename} bucket=#{bucket}"
        )

        :error
    end
  end

  defp serialize(state_content, version) do
    Jason.encode!(%{version: version, state: state_content})
  end

  @spec safe_parse(
          (term, non_neg_integer, non_neg_integer -> {:ok, any()} | :error),
          non_neg_integer,
          binary()
        ) ::
          any() | {:error, :noparse}
  defp safe_parse(restore_fn, current_version, binary) do
    {:ok, %{:version => stored_version, :state => state_content}} =
      Jason.decode(binary, keys: :atoms)

    restore_fn.(state_content, stored_version, current_version)
  rescue
    err ->
      Logger.error([
        "event=persistent_state_parse_error ",
        Exception.message(err),
        " - ",
        inspect(__STACKTRACE__)
      ])

      {:error, :noparse}
  end

  def state_write(pid, time) do
    Process.send_after(pid, {:write, time}, time)
  end

  def remove_state_from_disk(state_filename) do
    Logger.info("Deleting persistent state from disk")

    filename =
      :orbit |> Application.get_env(:persistent_state_dir) |> Path.join(state_filename)

    File.exists?(filename) && File.rm!(filename)
  end
end
