import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(userId: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    path: '/socket.io',
    auth: { userId },
    withCredentials: true,
    autoConnect: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
