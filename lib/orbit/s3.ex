defmodule Orbit.S3 do
  require Logger

  @typedoc """
  A reference to a folder whose actual name and prefix will be fetched at runtime
  from `:orbit`, `Orbit.S3`, `:folders`.
  """
  @type s3_ref :: atom()

  @type read_opt ::
          {:log_level_ok, Logger.level() | nil} | {:log_level_missing, Logger.level() | nil}
  @type read_result :: {:ok, binary()} | {:error, :missing} | {:error, term()}
  @spec read(s3_ref(), String.t(), [read_opt()]) :: read_result()
  def read(s3_ref, path, opts \\ []) do
    %{bucket: bucket, prefix: prefix, mode: mode} = folder_config(s3_ref)

    path = apply_prefix(prefix, path)

    result =
      case mode do
        :normal -> read_s3(bucket, path)
        :local -> read_local(bucket, path)
        :anonymous -> read_anonymous(bucket, path)
      end

    case result do
      {:ok, data} ->
        level = Keyword.get(opts, :log_level_ok, :info)

        if level do
          log(:read, s3_ref, mode, bucket, path, level: level, bytes: byte_size(data))
        end

      {:error, :missing} ->
        level = Keyword.get(opts, :log_level_missing, :warning)

        if level do
          log(:read, s3_ref, mode, bucket, path, level: level, error: :missing)
        end

      {:error, e} ->
        log(:read, s3_ref, mode, bucket, path, level: :warning, error: e)
    end

    result
  end

  @spec read_s3(String.t(), String.t()) :: read_result()
  defp read_s3(bucket, path) do
    ExAws.S3.get_object(bucket, path)
    |> ExAws.request()
    |> case do
      {:ok, %{status_code: 200, body: data}} -> {:ok, data}
      {:error, {:http_error, 404, _}} -> {:error, :missing}
      {_, error_or_failure} -> {:error, error_or_failure}
    end
  end

  @spec read_local(String.t(), String.t()) :: read_result()
  defp read_local(bucket, path) do
    path = local_path(bucket, path)

    case File.read(path) do
      {:ok, data} -> {:ok, data}
      {:error, :enoent} -> {:error, :missing}
      {:error, e} -> {:error, e}
    end
  end

  @spec read_anonymous(String.t(), String.t()) :: read_result()
  defp read_anonymous(bucket, path) do
    case HTTPoison.get(anonymous_url(bucket, path)) do
      {:ok, %HTTPoison.Response{status_code: 200, body: binary_data}} ->
        {:ok, binary_data}

      {:ok, %HTTPoison.Response{status_code: 404}} ->
        {:error, :missing}

      {_, error_or_failure} ->
        {:error, error_or_failure}
    end
  end

  @spec write!(s3_ref(), String.t(), binary()) :: term()
  def write!(s3_ref, path, data) do
    %{bucket: bucket, prefix: prefix, mode: mode} = folder_config(s3_ref)

    path = apply_prefix(prefix, path)

    log(:write, s3_ref, mode, bucket, path, bytes: byte_size(data))

    case mode do
      :normal ->
        ExAws.S3.put_object(bucket, path, data)
        |> ExAws.request!()

      :local ->
        path = local_path(bucket, path)
        path_dir = Path.dirname(path)
        File.mkdir_p!(path_dir)
        File.write!(path, data)

      :anonymous ->
        raise "can't write to S3 anonymously"
    end
  end

  @spec delete!(s3_ref(), String.t()) :: term()
  def delete!(s3_ref, path) do
    %{bucket: bucket, prefix: prefix, mode: mode} = folder_config(s3_ref)

    path = apply_prefix(prefix, path)

    log(:delete, s3_ref, mode, bucket, path)

    case mode do
      :normal ->
        ExAws.S3.delete_object(bucket, path)
        |> ExAws.request!()

      :local ->
        path = local_path(bucket, path)
        File.rm!(path)

      :anonymous ->
        raise "can't delete from S3 anonymously"
    end
  end

  @doc """
  Lists keys in the given ref with the given prefix.

  Per the [API documentation](https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html),
  returns keys in ascending order.
  """
  @spec ls!(s3_ref(), String.t() | nil) :: Enumerable.t(String.t())
  def ls!(s3_ref, path \\ nil) do
    %{bucket: bucket, prefix: prefix, mode: mode} = folder_config(s3_ref)

    path = apply_prefix(prefix, path)

    log(:ls, s3_ref, mode, bucket, path)

    case mode do
      :normal ->
        ExAws.S3.list_objects_v2(
          bucket,
          if path do
            [prefix: path]
          else
            []
          end
        )
        |> ExAws.stream!()
        |> Stream.map(& &1.key)

      :local ->
        path = local_path(bucket, path)

        Enum.concat(Path.wildcard("#{path}**"), Path.wildcard("#{path}**/**"))
        |> Enum.reject(&File.dir?/1)
        |> Stream.map(&Path.relative_to(&1, local_path(bucket, "")))

      :anonymous ->
        raise "can't ls S3 anonymously"
    end
    |> Stream.map(
      case prefix do
        nil -> & &1
        prefix -> &Path.relative_to(&1, prefix)
      end
    )
  end

  @spec presigned_url!(s3_ref(), String.t()) :: String.t()
  def presigned_url!(s3_ref, path) do
    %{bucket: bucket, prefix: prefix, mode: mode} = folder_config(s3_ref)

    path = apply_prefix(prefix, path)

    case mode do
      :normal ->
        {:ok, url} =
          ExAws.S3.presigned_url(
            ExAws.Config.new(:s3),
            :get,
            bucket,
            path,
            # https://app.asana.com/0/616151179860796/1207721363846626/f
            # https://github.com/ex-aws/ex_aws_s3/blob/v2.5.4/lib/ex_aws/s3.ex#L1320
            virtual_host: true
          )

        url

      :local ->
        # Browsers won't redirect to this URL for security reasons, but it's still accurate
        "file://" <> local_path(bucket, path)

      :anonymous ->
        anonymous_url(bucket, path)
    end
  end

  @spec has_ref(s3_ref()) :: boolean()
  def has_ref(s3_ref) do
    Application.fetch_env!(:orbit, Orbit.S3)
    |> Keyword.fetch!(:folders)
    |> Keyword.get(s3_ref)
    |> then(&(&1 != nil))
  end

  @spec apply_prefix(String.t() | nil, String.t() | nil) :: String.t() | nil
  defp apply_prefix(nil, path), do: path
  defp apply_prefix(prefix, nil), do: prefix
  defp apply_prefix(prefix, path), do: "#{prefix}/#{path}"

  @spec anonymous_url(String.t(), String.t()) :: String.t()
  defp anonymous_url(bucket, prefixed_path) do
    "https://#{bucket}.s3.amazonaws.com/#{prefixed_path}"
  end

  @spec local_path(String.t(), String.t()) :: String.t()
  defp local_path(bucket, prefixed_path) do
    Application.app_dir(:orbit, ["priv", "s3", bucket, prefixed_path])
  end

  @type s3_mode :: :normal | :local | :anonymous
  @type folder_config :: %{
          bucket: String.t(),
          prefix: String.t() | nil,
          mode: s3_mode()
        }
  @spec folder_config(s3_ref()) :: folder_config()
  defp folder_config(s3_ref) do
    folder_s3_uri =
      Application.fetch_env!(:orbit, Orbit.S3)
      |> Keyword.fetch!(:folders)
      |> Keyword.fetch!(s3_ref)
      |> URI.new!()

    %URI{
      host: bucket,
      path: prefix_with_surrounding_slashes,
      scheme: scheme
    } = folder_s3_uri

    prefix =
      case String.trim(prefix_with_surrounding_slashes, "/") do
        "" -> nil
        prefix -> prefix
      end

    mode =
      case scheme do
        "s3" -> :normal
        "local-s3-stub" -> :local
        "s3-anonymous" -> :anonymous
      end

    %{
      bucket: bucket,
      prefix: prefix,
      mode: mode
    }
  end

  @typep log_extra :: [level: Logger.level(), error: term(), bytes: integer()]
  @spec log(atom(), s3_ref(), s3_mode(), String.t(), String.t() | nil, log_extra()) :: :ok
  defp log(method, s3_ref, mode, bucket, path, extra \\ []) do
    message =
      "s3 method=#{method} s3_ref=#{s3_ref} mode=#{mode} bucket=#{bucket} path=#{path}" <>
        if(extra[:bytes], do: " bytes=#{extra[:bytes]}", else: "") <>
        if extra[:error], do: " error=#{inspect(extra[:error])}", else: ""

    Logger.log(Keyword.get(extra, :level, :info), message)
  end
end
