/**
 * This file will be loaded when the user visits "/".
 */

import { PUB_SUB } from "./app";
import { pushJoinGame } from "./user_socket";

console.log("loaded index_page.js");

const joinGameInput = document.querySelector(".join-game-input");
const joinGameButton = document.querySelector(".join-game-button");

if (joinGameButton) {
  joinGameButton.onclick = () => {
    const gameId = joinGameInput.value;
    gameId && pushJoinGame(gameId);
  };
}

const alertDanger = document.querySelector(".alert-danger");

PUB_SUB.subscribe("game_not_found", gameId => {
  alertDanger.innerHTML = `Game '${gameId}' not found.`;
});
