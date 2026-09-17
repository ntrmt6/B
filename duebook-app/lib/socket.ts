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
    // Re-join on reconnect so the room subscription is restored.
    if (joinedTid) socket?.emit('join-tenant', joinedTid);
  });
  return socket;
}

/**
 * Join a tenant room. Resolves once the server has acknowledged the join
 * (so the caller can safely refetch and expect subsequent broadcasts).
 * Falls back to a short delay if the server does not send an ack.
 */
export function joinTenant(tenantId: string): Promise<void> {
  const s = getSocket();
  joinedTid = tenantId;
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    const emitWithAck = () => {
      try {
        s.emit('join-tenant', tenantId, () => finish());
      } catch {
        finish();
      }
    };
    if (s.connected) {
      emitWithAck();
    } else {
      s.once('connect', emitWithAck);
    }
    // Safety timeout: if server doesn't ack (old build, network hiccup),
    // resolve anyway so callers don't hang forever.
    setTimeout(finish, 3000);
  });
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
