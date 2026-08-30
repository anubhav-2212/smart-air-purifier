import express from "express";
import http from "http";
import { Server } from "socket.io";
import sensorRoutes from "./routes/sensor.routes.js";
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
dotenv.config();
import historyRoutes from "./routes/history.routes.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.set("io", io);

app.use(express.json());

const PORT = process.env.PORT || 8000;

app.use("/api", sensorRoutes);
app.use("/api", historyRoutes);

app.get("/", (req, res) => {
  res.send("Hello from the server!");
});

connectDB();

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});
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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});