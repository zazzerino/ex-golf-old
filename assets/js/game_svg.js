import { rotateArray } from "./lib";
import { animateElem, makeSvgGroup, makeSvgImage, makeSvgRect, makeSvgText } from "./svg";

import {
  pushUncoverCard, pushTakeFromDeck, pushTakeFromTable, pushDiscard, pushSwapCard
} from "./user_socket";

// size of the game svg elem in px
const ELEM_WIDTH = 600;
const ELEM_HEIGHT = 500;

// size of svg card images in px
const CARD_WIDTH = 60;
const CARD_HEIGHT = 84;

// px between cards
const HAND_PADDING = 2;

/**
 * Appends game elements to `elem`.
 * Returns a function that will animate the game.
 */
export function drawGame(elem, userId, game, width = ELEM_WIDTH, height = ELEM_HEIGHT) {
  const callbacks = [];
  const animate = () => callbacks.forEach(fn => fn && fn());

  const [deck, animDeck] = makeDeck(userId, game, width, height);
  elem.appendChild(deck);
  callbacks.push(animDeck);

  if (game.state === "init") {
    return animate;
  }

  const hands = makeHands(userId, game, width, height);
  hands.forEach(([hand, _animHand]) => elem.appendChild(hand));

  const [tableCard, secondTableCard, animTableCard] =
    makeTableCards(userId, game, width, height);

  callbacks.push(animTableCard);

  // add the second table card first, so it's on the bottom
  secondTableCard && elem.appendChild(secondTableCard);
  tableCard && elem.appendChild(tableCard);

  const [heldCards, animHeldCard] = makeHeldCards(userId, game, width, height);
  heldCards.forEach(card => elem.appendChild(card));
  callbacks.push(animHeldCard);

  const score = makeScore(game.players[1], "BOTTOM", width, height);
  elem.appendChild(score);

  if (game.state === "over") {
    const gameOverMessage = makeGameOverMessage(width, height);
    elem.appendChild(gameOverMessage);
    return; // if the game's over, no need to animate
  }

  return animate;
}

function makeCard({ x, y, cardName, className, onClick, highlight }) {
  // adjust x and y so the image is centered
  x = x - CARD_WIDTH / 2;
  y = y - CARD_HEIGHT / 2;

  const href = `/images/cards/${cardName}.svg`;
  const elem = makeSvgImage({ x, y, href, onClick });

  elem.setAttribute("width", "10%");
  elem.classList.add("card");

  className && elem.classList.add(className);
  highlight && elem.classList.add("highlight");

  return elem;
}

function makeDeck(userId, game, _width, height) {
  const { x, y } = deckCoord(game.state);

  // '2B' is the back of a card
  const cardName = "2B";
  const className = "deck";

  let highlight, onClick, callback;

  if (isPlayable(userId, game, "deck")) {
    highlight = true;
    onClick = pushTakeFromDeck;
  }

  const card = makeCard({ x, y, cardName, className, highlight, onClick });

  if (game.state === "init") {
    callback = () => animateElem(card, { y: -height / 2, rotate: 90 });
  }

  return [card, callback];
}

function makeTableCards(userId, game, width, height) {
  const cardName = game.table_cards[0];
  if (!cardName) return [null];

  const { x, y } = TABLE_CARD_COORD;
  const className = "table-card";

  let highlight, onClick;

  if (isPlayable(userId, game, "table-card")) {
    highlight = true;
    onClick = pushTakeFromTable;
  }

  const card = makeCard({ x, y, cardName, className, highlight, onClick });

  // we'll draw the second card (if it exists) while the top card is animating
  let secondCard;
  let callback;

  const event = game.events[0];
  const action = event && event.action;

  if (action === "discard") {
    if (game.table_cards.length > 1) {
      const secondName = game.table_cards[1];
      secondCard = makeCard({ x, y, cardName: secondName });
    }

    const pos = playerPosition(userId, game, event.player_id);
    const coord = heldCardCoord(pos, width, height);
    const animX = coord.x - CARD_WIDTH / 2;
    const animY = coord.y;
    
    callback = () => animateElem(card, { x: animX, y: animY });
    
  } else if (action === "swap_card") {
    if (game.table_cards.length > 1) {
      const secondName = game.table_cards[1];
      secondCard = makeCard({ x, y, cardName: secondName });
    }

    const pos = playerPosition(userId, game, event.player_id);
    const coord = handCoord(pos, width, height);
    const animX = coord.x - CARD_WIDTH / 2;
    const animY = coord.y - CARD_HEIGHT / 12;
    
    callback = () => animateElem(card, { x: animX, y: animY, rotate: 90 });
  }

  return [card, secondCard, callback];
}

function makeHand({ userId, playerId, hand, transform, game }) {
  const elem = makeSvgGroup();
  elem.classList.add("hand");
  elem.setAttribute("transform", transform);

  let callback;

  for (const [index, handCard] of hand.entries()) {
    let { card: cardName, "covered?": isCovered } = handCard;
    cardName = isCovered ? "2B" : cardName;
    const className = `h${index}`;
    const { x, y } = handCardCoord(index);

    let highlight, onClick;

    if (game.state === "uncover_two" && userId === playerId) {
      highlight = true;
      onClick = () => pushUncoverCard(index);
    } else if (userId === playerId && isPlayable(userId, game, className)) {
      if (isCovered && game.state === "uncover") {
        highlight = true;
        onClick = () => pushUncoverCard(index);
      } else if (game.state === "discard") {
        highlight = true;
        onClick = () => pushSwapCard(index);
      }
    }

    const card = makeCard({ x, y, cardName, className, highlight, onClick });
    elem.appendChild(card);
  }

  return [elem, callback];
}

function makeHands(userId, game, width = ELEM_WIDTH, height = ELEM_HEIGHT) {
  const { player_order } = game;
  const userIndex = game.player_order.findIndex(id => id === userId);
  const playerIds = rotateArray(player_order, userIndex);
  const players = playerIds.map(id => game.players[id]);
  const positions = handPositions(player_order.length);

  const hands = [];

  for (const [index, player] of players.entries()) {
    const { id: playerId, hand } = player;
    const position = positions[index];
    const { x, y, rotate } = handCoord(position, width, height);
    const transform = `translate(${x}, ${y}), rotate(${rotate})`;

    const [handElem, callback] = makeHand({ userId, playerId, hand, transform, game });
    hands.push([handElem, callback]);
  }

  return hands;
}

function makeHeldCards(userId, game, width, height) {
  const userIndex = game.player_order.findIndex(id => id === userId);
  const playerIds = rotateArray(game.player_order, userIndex);
  const players = playerIds.map(id => game.players[id]);
  const positions = handPositions(players.length);

  const cards = [];
  let callback;

  for (const [index, player] of players.entries()) {
    const cardName = player.held_card;

    if (cardName) {
      const position = positions[index];
      const className = "held-card";

      let { x, y, rotate } = heldCardCoord(position, width, height);
      const transform = `rotate(${rotate})`;

      let highlight, onClick;

      if (userId === player.id && isPlayable(userId, game, "held-card")) {
        highlight = true;
        onClick = pushDiscard;
      }

      const card = makeCard({ x, y, cardName, className, highlight, onClick });
      card.setAttribute("transform", transform);
      cards.push(card);

      // this is safe, because there will always be at least one action if there's a held card
      const lastAction = game.events[0].action;

      if (lastAction === "take_from_deck") {
        x += CARD_WIDTH / 2;
        callback = () => animateElem(card, { x: -x, y: -y });
      }
      else if (lastAction === "take_from_table") {
        x -= CARD_WIDTH / 2;
        callback = () => animateElem(card, { x: -x, y: -y });
      }
    }
  }

  return [cards, callback];
}

function makeScore(player, position, width, height) {
  const { x, y } = scoreCoord(position, width, height);
  const group = makeSvgGroup();
  group.classList.add("player-score");

  const rw = width * 0.25;
  const rh = height * 0.15;
  const rx = x - rw / 2;
  const ry = y - rh / 2;

  const rect = makeSvgRect({ x: rx, y: ry, width: rw, height: rh });
  group.appendChild(rect);

  const nameText = makeSvgText({ x, y: y - 10, text: `Name: ${player.name}` });
  group.appendChild(nameText);

  const scoreText = makeSvgText({ x, y: y + 12, text: `Score: ${player.score}` });
  group.appendChild(scoreText);

  return group;
}

function scoreCoord(position, width, height) {
  let x = 0, y = 0;

  switch (position) {
    case 'BOTTOM':
      x = -CARD_WIDTH * 3;
      y = height / 2 - CARD_HEIGHT - HAND_PADDING * 4;
      break;
    case 'LEFT':
      x = -(width / 2) + CARD_HEIGHT + HAND_PADDING * 4;
      y = -CARD_WIDTH * 2.4;
      break;
    case 'TOP':
      x = CARD_WIDTH * 3;
      y = -height / 2 + CARD_HEIGHT + HAND_PADDING * 4;
      break;
    case 'RIGHT':
      x = width / 2 - CARD_HEIGHT - HAND_PADDING * 4;
      y = -CARD_WIDTH * 2.4;
      break;
  }

  return { x, y };
}

function makeGameOverMessage(_width, _height) {
  const group = makeSvgGroup();
  group.classList.add("game-over-message");

  const text = makeSvgText({ x: 0, y: 0, text: "Game Over" });
  group.appendChild(text);

  return group;
}

export function playableCards(gameState) {
  switch (gameState) {
    case "uncover_two":
    case "uncover":
      return ["h0", "h1", "h2", "h3", "h4", "h5"];

    case "take":
      return ["deck", "table-card"];

    case "discard":
      return ["h0", "h1", "h2", "h3", "h4", "h5", "held-card"];

    default:
      return [];
  }
}

function isPlayable(userId, { next_player_id, state }, cardPos) {
  return userId === next_player_id
    && playableCards(state).includes(cardPos);
}

function handPositions(playerCount) {
  switch (playerCount) {
    case 1: return ["BOTTOM"];
    case 2: return ["BOTTOM", "TOP"];
    case 3: return ["BOTTOM", "LEFT", "RIGHT"];
    case 4: return ["BOTTOM", "LEFT", "TOP", "RIGHT"];
    default: throw new Error(`invalid playerCount: ${playerCount}`);
  }
}

function playerPosition(userId, game, playerId) {
  const userIndex = game.player_order.findIndex(id => id === userId);
  const playerIds = rotateArray(game.player_order, userIndex);
  const playerIndex = playerIds.findIndex(id => id === playerId);
  const positions = handPositions(playerIds.length);

  return positions[playerIndex];
}

function handCoord(position, width, height) {
  let x, y, rotate;

  switch (position) {
    case 'BOTTOM':
      x = 0
      y = (height / 2) - CARD_HEIGHT - (HAND_PADDING * 4);
      rotate = 0;
      break;

    case 'LEFT':
      x = -(width / 2) + CARD_HEIGHT + (HAND_PADDING * 4);
      y = 0;
      rotate = 90;
      break;

    case 'TOP':
      x = 0;
      y = -(height / 2) + CARD_HEIGHT + (HAND_PADDING * 4);
      rotate = 180;
      break;

    case 'RIGHT':
      x = width / 2 - CARD_HEIGHT - (HAND_PADDING * 4);
      y = 0;
      rotate = 270;
      break;

    default:
      throw new Error("invalid hand position");
  }

  return { x, y, rotate };
}

function deckCoord(gameState) {
  const x = gameState === "init" ? 0 : -CARD_WIDTH / 2 - 2;
  const y = 0;

  return { x, y };
}

const TABLE_CARD_COORD = {
  x: CARD_WIDTH / 2 + 2,
  y: 0,
}

function handCardCoord(index) {
  const xOffset = index % 3;
  const yOffset = index < 3 ? 0 : CARD_HEIGHT + HAND_PADDING;

  const x = (CARD_WIDTH * xOffset) + (HAND_PADDING * xOffset) - CARD_WIDTH;
  const y = yOffset - (CARD_HEIGHT / 2);
  return { x, y };
}

function heldCardCoord(position, width, height) {
  let x, y;
  let rotate = 0;

  switch (position) {
    case 'BOTTOM':
      x = CARD_WIDTH * 1.5;
      y = height / 2 - CARD_HEIGHT - HAND_PADDING * 4;
      break;

    case 'LEFT':
      x = -width / 2 + CARD_HEIGHT + HAND_PADDING * 4;
      y = CARD_WIDTH * 1.5 + HAND_PADDING * 4;
      rotate = 90;
      break;

    case 'TOP':
      x = -CARD_WIDTH * 1.5;
      y = -height / 2 + CARD_HEIGHT + HAND_PADDING * 4;
      break;

    case 'RIGHT':
      x = width / 2 - CARD_HEIGHT - HAND_PADDING * 4;
      y = -CARD_WIDTH * 1.5 - HAND_PADDING * 4;
      rotate = 90;
      break;
  }

  return { x, y, rotate };
}
