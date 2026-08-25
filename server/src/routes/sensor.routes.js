import express from "express";
import { receiveSensorData } from "../controllers/sensor.controller.js";

const router = express.Router();

router.post("/telemetry", receiveSensorData);

export default router;