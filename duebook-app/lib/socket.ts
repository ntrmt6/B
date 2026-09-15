import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let joinedTid: string | null = null;

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function getSocket(): Socket {
  if (socket) return socket;
  const url = API_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  socket = io(url, {
    transports: ['websocket', 'polling'],
    withCredentials: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    autoConnect: true,
  });
  socket.on('connect', () => {
    if (joinedTid) socket?.emit('join-tenant', joinedTid);
  });
  return socket;
}

export function joinTenant(tenantId: string) {
  const s = getSocket();
  joinedTid = tenantId;
  if (s.connected) s.emit('join-tenant', tenantId);
}

export function leaveTenant() {
  const s = getSocket();
  if (joinedTid && s.connected) s.emit('leave-tenant', joinedTid);
  joinedTid = null;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    joinedTid = null;
  }
}
