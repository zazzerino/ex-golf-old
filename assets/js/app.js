/**
 * This file will be loaded on every page.
 */

import "../css/app.css"

// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
import "phoenix_html"

// Establish Phoenix Socket and LiveView configuration.
import { Socket } from "phoenix"
import { LiveSocket } from "phoenix_live_view"

import "./user_socket.js"
import { makePubSub } from "./lib"

console.log("loaded app.js");

export const PUBSUB = makePubSub();

// connect if there are any LiveViews on the page
const csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content");
const liveSocket = new LiveSocket("/live", Socket, { params: { _csrf_token: csrfToken } });
liveSocket.connect();
