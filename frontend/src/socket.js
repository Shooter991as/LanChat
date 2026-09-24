import { io } from "socket.io-client";
import { SERVER_URL } from "./config";

let socket = null;

export function connectSocket(token) {
  if (socket) return socket;
  socket = io(SERVER_URL, { auth: { token } });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
