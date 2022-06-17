defmodule Golf do
  alias Golf.Game.Player
  @p1 %Player{id: 1, name: "Alice"}
  @p2 %Player{id: 2, name: "Bob"}
  @p3 %Player{id: 3, name: "Cassie"}
  @p4 %Player{id: 4, name: "Damon"}

  def players do
    {@p1, @p2, @p3, @p4}
  end
end
