import express from "express";
import { receiveSensorData, setFanSpeed } from "../controllers/sensor.controller.js";

const sensorRoute  = express.Router();

sensorRoute.post("/telemetry", receiveSensorData);
sensorRoute.post("/fan", setFanSpeed);

export default sensorRoute;