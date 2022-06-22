defmodule Golf.Game.HandCard do
  alias __MODULE__
  alias Golf.Game.Card

  @derive Jason.Encoder
  defstruct card: nil, covered?: true

  @type t :: %HandCard{
          card: Card.t(),
          covered?: boolean
        }

  def new(card, opts \\ []) do
    covered? = Keyword.get(opts, :covered?, true)
    %HandCard{card: card, covered?: covered?}
  end

  def uncover(hand_card) do
    %HandCard{hand_card | covered?: false}
  end
end
