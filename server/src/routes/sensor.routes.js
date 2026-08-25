import express from "express";
import { receiveSensorData } from "../controllers/sensor.controller.js";

const sensorRoute  = express.Router();

sensorRoute.post("/telemetry", receiveSensorData);

export default sensorRoute;