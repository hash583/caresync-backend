import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "https://frontend-caresync.vercel.app", // ✅ exact origin
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ["websocket", "polling"] // ✅ important for Railway
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on("joinFamily", (familyId) => {
      socket.join(familyId);
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected");
    });
  });
};

export const getIO = () => io;