import { Socket } from "phoenix"
import { PUBSUB } from "./app";

const socket = new Socket("/socket", { params: { token: window.userToken } })
socket.connect()

const lobbyChan = socket.channel("room:lobby");
let gameChan;

lobbyChan.join()
  .receive("ok", ({ user }) => {
    if (user) {
      PUBSUB.publish("user_update", user);

      if (user.current_game) {
        joinGameChan(user.current_game);
      }
    }
  })
  .receive("error", console.error);

function joinGameChan(gameId) {
  // if we're connected to a game channel already, leave it
  gameChan && gameChan.leave().receive("error", console.error);
  gameChan = socket.channel(`game:${gameId}`);

  gameChan.on("game_update", ({ game, msg }) => {
    PUBSUB.publish("game_update", game)
    msg && console.log(msg);
  });

  gameChan.join()
    .receive("ok", ({ game }) => PUBSUB.publish("game_update", game))
    .receive("error", console.error);
}

export function pushCreateGame() {
  lobbyChan.push("create_game")
    .receive("ok", ({ user, game }) => {
      console.log("Game created:", game);
      user && PUBSUB.publish("user_update", user);
      game && joinGameChan(game.id);
    })
    .receive("error", console.error);
}

export function pushLeaveGame() {
  gameChan &&
    gameChan.push("leave_game")
      .receive("ok", ({ user }) => {
        user && PUBSUB.publish("user_update", user);

        gameChan.leave()
          .receive("ok", () => PUBSUB.publish("game_left"))
          .receive("error", console.error);
      })
      .receive("error", console.error);
}

export function pushJoinGame(gameId) {
  return lobbyChan.push("join_game", { gameId })
    .receive("ok", ({ user, game }) => {
      if (user && game) {
        PUBSUB.publish("user_update", user);
        joinGameChan(game.id);

        if (location.pathname !== "/game") {
          location.href = "/game";
        }
      }
    })
    .receive("error", () => PUBSUB.publish("game_not_found", gameId));
}

export function pushStartGame() {
  gameChan &&
    gameChan.push("start_game")
      .receive("error", console.error);
}

export function pushUncoverCard(handIndex) {
  gameChan &&
    gameChan.push("uncover_card", { handIndex })
      .receive("error", console.error);
}

export function pushTakeFromDeck() {
  gameChan &&
    gameChan.push("take_from_deck")
      .receive("error", console.error);
}

export function pushTakeFromTable() {
  gameChan &&
    gameChan.push("take_from_table")
      .receive("error", console.error);
}

export function pushDiscard() {
  gameChan &&
    gameChan.push("discard")
      .receive("error", console.error);
}

export function pushSwapCard(handIndex) {
  gameChan &&
    gameChan.push("swap_card", { handIndex })
      .receive("error", console.error);
}
