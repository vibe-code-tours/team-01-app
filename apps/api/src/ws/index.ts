import type { Server as SocketIOServer, Socket } from "socket.io";
import { auth } from "../lib/auth.js";

export const setupSocketIO = (io: SocketIOServer) => {
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      // better-auth uses session tokens via cookies/headers
      // For WebSocket, we verify the session token directly
      const session = await auth.api.getSession({
        headers: new Headers({ cookie: `better-auth.session_token=${token}` }),
      });

      if (!session) {
        return next(new Error("Invalid session"));
      }

      socket.data.user = {
        sub: session.user.id,
        email: session.user.email,
        role: session.user.role,
      };
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as { sub: string; email: string; role: string };
    console.log(`[Socket.IO] User ${user.email} connected (${socket.id})`);

    socket.join(`user:${user.sub}`);

    if (user.role === "admin" || user.role === "super-admin") {
      socket.join("admins");
    }

    socket.on("disconnect", () => {
      console.log(`[Socket.IO] User ${user.email} disconnected (${socket.id})`);
    });
  });
};
