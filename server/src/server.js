import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

import sensorRoutes from "./routes/sensor.routes.js";
import historyRoutes from "./routes/history.routes.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const app = express();

const server = http.createServer(app);

/*
 * EXPRESS CORS
 */
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

/*
 * SOCKET.IO
 */
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);

const PORT = process.env.PORT || 8000;

/*
 * API ROUTES
 */
app.use("/api", sensorRoutes);
app.use("/api", historyRoutes);

/*
 * ROOT
 */
app.get("/", (req, res) => {
  res.send("Hello from the server!");
});

/*
 * DATABASE
 */
connectDB();

/*
 * SOCKET CONNECTION
 */
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

/*
 * TEST LIVE TELEMETRY
 */
app.get("/test-telemetry", (req, res) => {
  const io = req.app.get("io");

  io.emit("telemetry", {
    deviceId: "esp32-air-001",
    temperature: 26.6,
    humidity: 74.5,
    mq135Raw: 499,
    mq135Voltage: 0.402,
    dustRaw: 0,
    dustVoltage: 0,
    dustDensity: 0,
  });

  res.json({
    success: true,
    message: "Test telemetry emitted",
  });
});

/*
 * TEST DASHBOARD HISTORY
 */
app.get("/test-dashboard", (req, res) => {
  const data = [
    {
      time: "10:00",
      temperature: 26.2,
      humidity: 72,
      dustDensity: 0.03,
      mq135Raw: 420,
    },
    {
      time: "10:05",
      temperature: 26.5,
      humidity: 73,
      dustDensity: 0.04,
      mq135Raw: 450,
    },
    {
      time: "10:10",
      temperature: 26.8,
      humidity: 74,
      dustDensity: 0.05,
      mq135Raw: 480,
    },
    {
      time: "10:15",
      temperature: 27.1,
      humidity: 75,
      dustDensity: 0.06,
      mq135Raw: 510,
    },
    {
      time: "10:20",
      temperature: 27.0,
      humidity: 74,
      dustDensity: 0.05,
      mq135Raw: 490,
    },
    {
      time: "10:25",
      temperature: 26.7,
      humidity: 73,
      dustDensity: 0.04,
      mq135Raw: 460,
    },
    {
      time: "10:30",
      temperature: 26.4,
      humidity: 72,
      dustDensity: 0.03,
      mq135Raw: 430,
    },
  ];

  res.json({
    success: true,
    count: data.length,
    data,
  });
});

/*
 * START SERVER
 */
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});