defmodule GolfWeb.GameChannel do
  use GolfWeb, :channel
  alias Golf.Accounts
  alias Golf.Game
  alias Golf.GameServer

  @impl true
  def join("game:" <> game_id, _payload, socket) do
    case GameServer.fetch_state(game_id) do
      {:ok, game} ->
        socket = assign(socket, :game_id, game_id)
        {:ok, %{game: game}, socket}

      _ ->
        {:error, %{reason: "game not found"}}
    end
  end

  @impl true
  def handle_in(
        "start_game",
        _payload,
        %{assigns: %{user_id: user_id, game_id: game_id}} = socket
      ) do
    with {:ok, game} <- GameServer.start_game(game_id, user_id) do
      msg = "The game has started."
      broadcast(socket, "game_update", %{game: game, msg: msg})
      {:noreply, socket}
    end
  end

  @impl true
  def handle_in("leave_game", _payload, %{assigns: %{user_id: user_id}} = socket) do
    with {:ok, user} <- Accounts.fetch_user(user_id),
         {:ok, user} <- Accounts.leave_current_game(user) do
      socket = GolfWeb.unassign(socket, :game_id)
      {:reply, {:ok, %{user: user}}, socket}
    end
  end

  @impl true
  def handle_in(
        "uncover_card",
        %{"handIndex" => hand_index},
        %{assigns: %{user_id: user_id, game_id: game_id}} = socket
      ) do
    event = Game.Event.new(:uncover, user_id, %{hand_index: hand_index})

    case GameServer.handle_event(game_id, event) do
      {:ok, game} ->
        name = game.players[user_id].name
        msg = "#{name} uncovered card #{hand_index}."
        broadcast(socket, "game_update", %{game: game, msg: msg})
        {:noreply, socket}

      _ ->
        {:noreply, socket}
    end
  end

  @impl true
  def handle_in(
        "take_from_deck",
        _payload,
        %{assigns: %{user_id: user_id, game_id: game_id}} = socket
      ) do
    event = Game.Event.new(:take_from_deck, user_id)

    case GameServer.handle_event(game_id, event) do
      {:ok, game} ->
        name = game.players[user_id].name
        msg = "#{name} took a card from the deck."
        broadcast(socket, "game_update", %{game: game, msg: msg})
        {:noreply, socket}

      _ ->
        {:noreply, socket}
    end
  end

  @impl true
  def handle_in(
        "take_from_table",
        _payload,
        %{assigns: %{user_id: user_id, game_id: game_id}} = socket
      ) do
    event = Game.Event.new(:take_from_table, user_id)

    case GameServer.handle_event(game_id, event) do
      {:ok, game} ->
        name = game.players[user_id].name
        msg = "#{name} took a card from the table."
        broadcast(socket, "game_update", %{game: game, msg: msg})
        {:noreply, socket}

      _ ->
        {:noreply, socket}
    end
  end

  @impl true
  def handle_in("discard", _payload, %{assigns: %{user_id: user_id, game_id: game_id}} = socket) do
    event = Game.Event.new(:discard, user_id)

    case GameServer.handle_event(game_id, event) do
      {:ok, game} ->
        name = game.players[user_id].name
        msg = "#{name} returned their held card to the table."
        broadcast(socket, "game_update", %{game: game, msg: msg})
        {:noreply, socket}

      _ ->
        {:noreply, socket}
    end
  end

  @impl true
  def handle_in(
        "swap_card",
        %{"handIndex" => hand_index},
        %{assigns: %{user_id: user_id, game_id: game_id}} = socket
      ) do
    event = Game.Event.new(:swap_card, user_id, %{hand_index: hand_index})

    case GameServer.handle_event(game_id, event) do
      {:ok, game} ->
        name = game.players[user_id].name
        msg = "#{name} swapped their held card for the card at #{hand_index}."
        broadcast(socket, "game_update", %{game: game, msg: msg})
        {:noreply, socket}

      _ ->
        {:noreply, socket}
    end
  end
end
