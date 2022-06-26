/**
 * This file will be loaded when the user visits "/game".
 */

import { PUBSUB } from "./app";
import { pushCreateGame, pushLeaveGame, pushStartGame } from "./user_socket";
import { removeChildren } from "./svg";
import { drawGame } from "./game_svg";

console.log("loaded game_page.js");

const state = {};
window.state = state;

const createGameButton = document.querySelector(".create-game-button");
createGameButton.onclick = pushCreateGame;

const startGameButton = document.querySelector(".start-game-button");
startGameButton.onclick = pushStartGame;

const leaveGameButton = document.querySelector(".leave-game-button");
leaveGameButton.onclick = pushLeaveGame;

const gameLabel = document.querySelector(".game-label");
const gameElem = document.querySelector(".game-elem");

const elemWidth = gameElem.clientWidth;
const elemHeight = gameElem.clientHeight;

PUBSUB.subscribe("user_update", user => {
  state.user = user;
});

PUBSUB.subscribe("game_update", game => {
  state.game = game;

  if (state.user.id === game.host_id && game.state === "init") {
    startGameButton.style.display = "inline-block";
  } else {
    startGameButton.style.display = "none";    
  }

  if (game) {
    leaveGameButton.style.display = "inline-block";
  }

  const gameLabelText = `Game: ${game.id}`;
  
  if (gameLabel.innerHTML === gameLabelText) {
    gameLabel.innerHTML = gameLabelText;
  }

  gameLabel.innerHTML = `Game: ${game.id}`;
  removeChildren(gameElem);

  const animate = drawGame(gameElem, state.user.id, game, elemWidth, elemHeight);
  animate && animate();
});

PUBSUB.subscribe("game_left", () => {
  console.log("Left game.");
  state.game = null;

  gameLabel.innerHTML = "";
  removeChildren(gameElem);

  startGameButton.style.display = "none";
  leaveGameButton.style.display = "none";
});
