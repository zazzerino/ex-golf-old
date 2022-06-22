defmodule Golf.Game.Player do
  alias __MODULE__
  alias Golf.Game.{Card, HandCard}

  @derive Jason.Encoder
  defstruct id: nil,
            name: nil,
            hand: [],
            held_card: nil

  @type id :: integer

  @type t :: %Player{
          id: id,
          name: String.t(),
          hand: [HandCard.t()],
          held_card: Card.t() | nil
        }

  @hand_size 6
  def hand_size(), do: @hand_size

  def from(%{id: id, name: name}) do
    %Player{id: id, name: name}
  end

  def init_hand(player, cards) do
    hand = Enum.map(cards, &HandCard.new/1)
    %Player{player | hand: hand}
  end

  def uncover_card(player, index) do
    hand = List.update_at(player.hand, index, &HandCard.uncover/1)
    %Player{player | hand: hand}
  end

  def hold_card(player, card) do
    %Player{player | held_card: card}
  end

  def discard(%{held_card: held_card} = player) when is_binary(held_card) do
    player = %Player{player | held_card: nil}
    {held_card, player}
  end

  def swap_card(%{held_card: held_card} = player, index) when is_binary(held_card) do
    %{card: card} = Enum.at(player.hand, index)
    hand = List.replace_at(player.hand, index, HandCard.new(held_card, covered?: false))
    player = %Player{player | held_card: nil, hand: hand}
    {card, player}
  end

  def all_uncovered?(player) do
    uncovered_card_count(player) === @hand_size
  end

  def uncovered_two?(player) do
    uncovered_card_count(player) === 2
  end

  defp uncovered_card_count(player) do
    Enum.count(player.hand, fn card -> not card.covered? end)
  end
end
