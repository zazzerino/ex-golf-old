defmodule GolfWeb.RoomChannel do
  use GolfWeb, :channel

  alias Golf.Accounts

  @impl true
  def join("room:lobby", _payload, %{assigns: %{user_id: user_id}} = socket) do
    if user = Accounts.get_user(user_id) do
      {:ok, %{user: user}, socket}
    else
      {:error, %{reason: "User not found"}}
    end
  end

  @impl true
  def join("room:lobby", _payload, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  @impl true
  def handle_in("shout", payload, socket) do
    broadcast(socket, "shout", payload)
    {:noreply, socket}
  end

  # # Add authorization logic here as required.
  # defp authorized?(_payload) do
  #   true
  # end

  # defp unassign(socket, key) do
  #   update_in(socket.assigns, &Map.drop(&1, [key]))
  # end
end
