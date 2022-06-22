defmodule GolfWeb.UserSocket do
  use Phoenix.Socket

  channel "room:*", GolfWeb.RoomChannel
  channel "game:*", GolfWeb.GameChannel

  @impl true
  def connect(%{"token" => token}, socket, _info) when is_binary(token) do
    # max_age: 1209600 is equivalent to two weeks in seconds
    case Phoenix.Token.verify(socket, "user socket", token, max_age: 1_209_600) do
      {:ok, user_id} ->
        {:ok, assign(socket, :user_id, user_id)}

      _ ->
        {:ok, socket}
    end
  end

  @impl true
  def connect(_params, socket, _info) do
    {:ok, socket}
  end

  @impl true
  def id(%{assigns: %{user_id: user_id}}) when is_integer(user_id) do
    "user_socket:#{user_id}"
  end

  @impl true
  def id(_socket), do: nil
end
