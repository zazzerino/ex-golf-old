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

  def init_hand(player, cards) do
    hand = Enum.map(cards, &%HandCard{card: &1})
    %Player{player | hand: hand}
  end
end
