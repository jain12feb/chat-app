import express from "express";
import { config } from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { connectDB } from "./lib/db.js";
import { app, server } from "./lib/socket.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// app.use("*", (req, res) => {
//   res.status(404).json({ message: "Route not found" });
// });

// if (process.env.NODE_ENV == "development") {
app.use(express.static(path.join(__dirname, "../backend/views")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../backend", "views", "index.html"));
});
// }

const startServer = async () => {
  try {
    await connectDB(); // Ensure DB connection is established before starting the server
    server.listen(PORT, () => {
      console.log(`Server is running on PORT: ${PORT}`);
    });
  } catch (error) {
    console.error("Error connecting to DB:", error.message);
    process.exit(1); // Exit process if DB connection fails
  }
};

startServer();
