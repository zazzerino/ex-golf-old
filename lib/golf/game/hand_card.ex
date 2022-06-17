defmodule Golf.Game.HandCard do
  alias __MODULE__
  alias Golf.Game.Card

  @derive Jason.Encoder
  defstruct card: nil, covered?: true

  @type t :: %HandCard{
          card: Card.t(),
          covered?: boolean
        }
end
