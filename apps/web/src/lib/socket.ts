"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;
let connecting = false;
let tokenPromise: Promise<string | null> | null = null;

async function getAuthToken(): Promise<string | null> {
  if (typeof document === "undefined") return null;
  if (!tokenPromise) {
    tokenPromise = fetch("/api/auth/socket-token", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.token ?? null)
      .catch(() => null);
  }
  return tokenPromise;
}

export async function connectSocket(): Promise<Socket | null> {
  // Already connected
  if (socket?.connected) return socket;
  // Already connecting — wait for it
  if (connecting) return socket;

  const token = await getAuthToken();
  if (!token) return null;

  connecting = true;
  const origin = window.location.origin;
  socket = io(origin, {
    auth: { token },
    path: "/api/socket-io/",
    transports: ["polling"],
    upgrade: false,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on("connect", () => {
    connecting = false;
    window.dispatchEvent(new Event("socket:ready"));
  });

  socket.on("connect_error", () => {
    connecting = false;
  });

  socket.on("disconnect", () => {
    connecting = false;
  });

  socket.connect();
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    connecting = false;
    tokenPromise = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function onSocketReady(callback: () => void): () => void {
  if (socket?.connected) {
    callback();
    return () => {};
  }
  const handler = () => callback();
  window.addEventListener("socket:ready", handler);
  return () => window.removeEventListener("socket:ready", handler);
}
