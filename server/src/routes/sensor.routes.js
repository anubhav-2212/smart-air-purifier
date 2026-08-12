const express = require("express");
const SensorReading = require("../models/SensorReading");

const router = express.Router();

router.post("/sensor-data", async (req, res) => {
    const { nodeId, pm25, pm10, temperature, humidity, battery, fanSpeed } = req.body;

    const requiredFields = { nodeId, pm25, pm10, temperature, humidity, battery };
    const missingField = Object.entries(requiredFields).find(
        ([, value]) => value === undefined || value === null
    );

    if (missingField) {
        return res.status(400).json({
            success: false,
            message: "Required sensor data is missing"
        });
    }

    try {
        const sensorReading = new SensorReading({
            nodeId,
            pm25,
            pm10,
            temperature,
            humidity,
            battery,
            fanSpeed
        });

        const savedReading = await sensorReading.save();

        return res.status(201).json({
            success: true,
            message: "Sensor data received successfully",
            data: savedReading
        });
    } catch (error) {
        console.error("Failed to save sensor data:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save sensor data"
        });
    }
});

module.exports = router;
