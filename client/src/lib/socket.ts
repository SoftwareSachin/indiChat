import { io, Socket } from "socket.io-client";

const SOCKET_URL = window.location.origin;

export const socket: Socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
});

export function getSocket(): Socket {
  return socket;
}

export function disconnectSocket() {
  socket.disconnect();
}
