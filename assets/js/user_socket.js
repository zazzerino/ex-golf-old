import {Socket} from "phoenix"

let socket = new Socket("/socket", {params: {token: window.userToken}})

socket.connect()

let lobbyChan = socket.channel("room:lobby");

lobbyChan.join()
  .receive("ok", console.log)
  .receive("error", console.error);

export { socket }
