import express from "express";
import { receiveSensorData, setFanSpeed , getFanSpeed} from "../controllers/sensor.controller.js";

const sensorRoute  = express.Router();

sensorRoute.post("/telemetry", receiveSensorData);
sensorRoute.post("/fan", setFanSpeed);
sensorRoute.get("/fan/:deviceId", getFanSpeed);

export default sensorRoute;