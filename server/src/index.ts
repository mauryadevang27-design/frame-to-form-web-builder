import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { RoomManager } from "./room-manager.js";
import { registerSocketHandlers } from "./socket-handlers.js";

const app = express();
const server = http.createServer(app);

// Enable CORS for web and extension origins
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  }),
);

app.use(express.json());

const roomManager = new RoomManager();

// Mount Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 10000,
  pingInterval: 5000,
});

registerSocketHandlers(io, roomManager);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "TogetherTube Realtime Server",
    activeRooms: roomManager.getActiveRoomCount(),
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

// REST endpoint for room preview
app.get("/api/rooms/:code", (req, res) => {
  const code = req.params.code;
  if (!code) {
    res.status(400).json({ error: "Room code required" });
    return;
  }
  const preview = roomManager.getRoomPreview(code);
  if (!preview) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json(preview);
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n=================================================`);
  console.log(` TogetherTube Realtime Server is running!`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Health Check: http://localhost:${PORT}/health`);
  console.log(` Socket.IO: ws://localhost:${PORT}`);
  console.log(`=================================================\n`);
});

const shutdown = () => {
  console.log("\nShutting down TogetherTube server...");
  io.close(() => {
    server.close(() => {
      console.log("Server stopped successfully.");
      process.exit(0);
    });
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
