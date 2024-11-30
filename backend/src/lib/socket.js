import { Server } from "socket.io";
import http from "http";
import express from "express";

// Initialize the express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io with CORS configuration for frontend communication
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"], // Add your frontend URL here for allowed cross-origin requests
  },
});

// In-memory object to store user-socket mappings: { userId: socketId }
const userSocketMap = {};

// Function to get the socket ID of a user by userId
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Handle the socket connection event
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Get the userId from the handshake query parameters
  const userId = socket.handshake.query.userId;

  // If userId is present, map the userId to the socketId
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`Mapped userId ${userId} to socketId ${socket.id}`);
  }

  // Emit the updated list of online users to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);

    // Remove the user from the userSocketMap on disconnect
    if (userId) {
      delete userSocketMap[userId];
      console.log(`Unmapped userId ${userId} from socketId ${socket.id}`);
    }

    // Emit the updated list of online users after a disconnection
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // Handle socket errors
  socket.on("error", (error) => {
    console.error(`Socket error: ${error}`);
  });
});

// Export server and socket instance for use in other parts of the application
export { io, app, server };
