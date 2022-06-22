defmodule GolfWeb.RoomChannel do
  use GolfWeb, :channel

  alias Golf.Accounts
  alias Golf.Game.Player
  alias Golf.Game
  alias Golf.GameServer

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
  def handle_in("create_game", _payload, %{assigns: %{user_id: user_id}} = socket) do
    with {:ok, user} <- Accounts.fetch_user(user_id),
         {:ok, user} <- Accounts.leave_current_game(user),
         player = Player.from(user),
         game = Game.new(player),
         {:ok, _pid} <- DynamicSupervisor.start_child(Golf.GameSupervisor, {GameServer, game}),
         {:ok, user} <- Accounts.update_user_current_game(user, game.id) do
      socket = assign(socket, :game_id, game.id)
      {:reply, {:ok, %{user: user, game: game}}, socket}
    end
  end

  @impl true
  def handle_in("join_game", %{"gameId" => game_id}, %{assigns: %{user_id: user_id}} = socket) do
    with [{_pid, _val}] <- Golf.lookup_game(game_id),
         {:ok, user} <- Accounts.fetch_user(user_id),
         {:ok, user} <- Accounts.leave_current_game(user),
         player = Player.from(user),
         {:ok, game} <- GameServer.add_player(game_id, player),
         {:ok, user} <- Accounts.update_user_current_game(user, game_id) do
      socket = assign(socket, :game_id, game_id)
      msg = "#{user.name} has joined the game."
      GolfWeb.broadcast_game_update(game, msg)
      {:reply, {:ok, %{user: user, game: game}}, socket}
    else
      _ ->
        {:reply, {:error, "Game not found"}, socket}
    end
  end
end
