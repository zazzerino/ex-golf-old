defmodule Golf.Game.HandCard do
  alias __MODULE__
  alias Golf.Game.Card

  @derive Jason.Encoder
  defstruct [:card, :covered?]

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

  def golf_value(%{card: card, covered?: covered?}) do
    if covered? do
      :none
    else
      Card.golf_value(card)
    end
  end
end
