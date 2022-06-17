defmodule Golf.Game do
  alias __MODULE__
  alias __MODULE__.{Card, Deck, Event, Player}

  @derive Jason.Encoder
  defstruct deck: [],
            table_cards: [],
            players: %{},
            player_order: [],
            host: nil,
            next_player: nil,
            events: []

  @type t :: %Game{
          deck: Deck.t(),
          table_cards: [Card.t()],
          players: %{Player.id() => Player.t()},
          player_order: [Player.id()],
          host: Player.id(),
          next_player: Player.id(),
          events: [Event]
        }

  @deck_count 2

  @spec new(Player.t()) :: t
  def new(player) do
    deck = Enum.shuffle(Deck.new(@deck_count))

    %Game{
      deck: deck,
      players: %{player.id => player},
      player_order: [player.id],
      host: player.id,
      next_player: player.id
    }
  end

  @spec add_player(t, Player.t()) :: t
  def add_player(game, player) do
    players = Map.put(game.players, player.id, player)
    player_order = game.player_order ++ [player.id]
    %Game{game | players: players, player_order: player_order}
  end

  def remove_player(%{host: host, next_player: next_player} = game, player_id)
      when host === player_id and next_player === player_id do
    host = next_player = next_item(game.player_order, player_id)
    {players, player_order} = remove_game_player(game, player_id)

    %Game{
      game
      | players: players,
        player_order: player_order,
        host: host,
        next_player: next_player
    }
  end

  def remove_player(%{host: host} = game, player_id)
      when host === player_id do
    host = next_item(game.player_order, player_id)
    {players, player_order} = remove_game_player(game, player_id)
    %Game{game | players: players, player_order: player_order, host: host}
  end

  def remove_player(%{next_player: next_player} = game, player_id)
      when next_player === player_id do
    next_player = next_item(game.player_order, player_id)
    {players, player_order} = remove_game_player(game, player_id)
    %Game{game | players: players, player_order: player_order, next_player: next_player}
  end

  def remove_player(game, player_id) do
    {players, player_order} = remove_game_player(game, player_id)
    %Game{game | players: players, player_order: player_order}
  end

  def start(game) do
    with {:ok, game} <- deal_hands(game),
         {:ok, game} <- deal_table_card(game) do
      {:ok, game}
    end
  end

  def deal_table_card(game) do
    with {:ok, card, deck} <- Deck.deal(game.deck),
         table_cards <- [card | game.table_cards] do
      game = %Game{game | deck: deck, table_cards: table_cards}
      {:ok, game}
    end
  end

  def deal_hand(game, player_id) do
    with {:ok, cards, deck} <- Deck.deal(game.deck, Player.hand_size()),
         players <- Map.update!(game.players, player_id, &Player.init_hand(&1, cards)) do
      game = %Game{game | deck: deck, players: players}
      {:ok, game}
    end
  end

  def deal_hands(game) do
    deal_to_player_ids({:ok, game}, game.player_order)
  end

  defp deal_to_player_ids({:ok, game}, []) do
    {:ok, game}
  end

  defp deal_to_player_ids({:ok, game}, [player_id | player_ids]) do
    with {:ok, game} <- deal_hand(game, player_id) do
      deal_to_player_ids({:ok, game}, player_ids)
    end
  end

  defp next_item(list, item) do
    if index = Enum.find_index(list, &(&1 === item)) do
      last_item? = index == length(list) - 1

      if last_item? do
        Enum.at(list, 0)
      else
        Enum.at(list, index + 1)
      end
    end
  end

  defp remove_game_player(game, player_id) do
    players = Map.delete(game.players, player_id)
    player_order = Enum.reject(game.player_order, &(&1 === player_id))
    {players, player_order}
  end
end
