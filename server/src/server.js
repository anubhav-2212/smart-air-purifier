import express from "express";
import http from "http";
import { Server } from "socket.io";
import sensorRoutes from "./routes/sensor.routes.js";
import { connectDB } from "./config/db.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
app.set("io", io);

app.use(express.json());
const PORT=process.env.PORT || 8000
// Your existing routes
app.use("/api", sensorRoutes);

app.get("/", (req, res) => {
  res.send("Hello from the server!");
});

connectDB();
// Socket connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
