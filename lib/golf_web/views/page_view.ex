defmodule GolfWeb.PageView do
  use GolfWeb, :view

  def svg_width(), do: "500"
  def svg_height(), do: "600"
  def svg_viewbox(), do: "-250, -300, 500, 600"

  # def svg_width(), do: "600"
  # def svg_height(), do: "500"
  # def svg_viewbox(), do: "-300, -250, 600, 500"
end
