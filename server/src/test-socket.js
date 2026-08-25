import { io } from "socket.io-client";

const socket = io("http://localhost:9000");

socket.on("connect", () => {
  console.log("✅ Connected to Socket.IO");
  console.log("Socket ID:", socket.id);
});

socket.on("telemetry", (data) => {
  console.log("📡 Telemetry received:");
  console.log(data);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected");
});

socket.on("connect_error", (error) => {
  console.log("❌ Connection error:");
  console.log(error.message);
});