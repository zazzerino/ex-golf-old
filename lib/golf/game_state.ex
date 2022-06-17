defmodule Golf.GameState do
  use GenStateMachine

  alias Golf.Game

  @max_players 4

  @type state :: :init | :uncover_two | :take | :discard | :uncover | :over

  # client

  def start(game) do
    GenStateMachine.start(__MODULE__, {game.state, game}, name: via_tuple(game.id))
  end

  def add_player(id, player) do
    GenStateMachine.call(via_tuple(id), {:add_player, player})
  end

  def remove_player(id, player_id) do
    GenStateMachine.call(via_tuple(id), {:remove_player, player_id})
  end

  defp via_tuple(id) do
    {:via, Registry, {Golf.GameRegistry, id}}
  end

  # server

  def handle_event({:call, from}, {:add_player, player}, :init, game)
      when is_map_key(game.players, player.id) do
    {:keep_state_and_data, [{:reply, from, {:error, "Player already joined"}}]}
  end

  def handle_event({:call, from}, {:add_player, _player}, :init, game)
      when length(game.player_order) >= @max_players do
    {:keep_state_and_data, [{:reply, from, {:error, "Max players"}}]}
  end

  def handle_event({:call, from}, {:add_player, player}, :init, game) do
    game = Game.add_player(game, player)
    {:keep_state, game, [{:reply, from, {:ok, game}}]}
  end

  def handle_event({:call, from}, {:remove_player, player_id}, _state, game)
      when not is_map_key(game.players, player_id) do
    {:keep_state_and_data, [{:reply, from, {:error, "Player not found"}}]}
  end

  def handle_event({:call, _from}, {:remove_player, player_id}, _state, game)
      when length(game.player_order) == 1 and game.host === player_id do
    # the last player left, stop the process
    {:stop, :normal}
  end

  def handle_event({:call, from}, {:remove_player, player_id}, _state, game) do
    game = Game.remove_player(game, player_id)
    {:keep_state, game, [{:reply, from, {:ok, game}}]}
  end

  def handle_event({:call, from}, {:start_game, player_id}, :init, game)
      when player_id === game.host do
    game = Game.start(game)
    {:next_state, :uncover_two, game, [{:reply, from, {:ok, game}}]}
  end
end
