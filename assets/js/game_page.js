/**
 * This file will be loaded when the user visits "/game".
 */

import { PUB_SUB } from "./app";
import { pushCreateGame, pushLeaveGame, pushStartGame } from "./user_socket";
import { drawGame } from "./game_svg";
import { removeChildren } from "./svg";

console.log("loaded game_page.js");

const state = {};
window.state = state;

const gameLabel = document.querySelector(".game-label");
const gameElem = document.querySelector(".game-elem");

PUB_SUB.subscribe("user_update", user => {
  state.user = user;
});

PUB_SUB.subscribe("game_update", game => {
  state.game = game;

  gameLabel.innerHTML = `Game: ${game.id}`;
  removeChildren(gameElem);

  const animate = drawGame(gameElem, state.user.id, game);
  animate && animate();
});

PUB_SUB.subscribe("game_left", () => {
  console.log("Left game.");
  state.game = null;

  gameLabel.innerHTML = "";
  removeChildren(gameElem);
});

const createGameButton = document.querySelector(".create-game-button");
createGameButton.onclick = pushCreateGame;

const startGameButton = document.querySelector(".start-game-button");
startGameButton.onclick = pushStartGame;

const leaveGameButton = document.querySelector(".leave-game-button");
leaveGameButton.onclick = pushLeaveGame;
