defmodule Golf.Game.Event do
  alias __MODULE__
  alias Golf.Game.Player

  @derive Jason.Encoder
  defstruct action: nil, player_id: nil, data: %{}

  @type action :: :take_from_deck | :take_from_table | :swap | :uncover

  @type t :: %Event{
          action: action,
          player_id: Player.id(),
          data: %{}
        }
end
