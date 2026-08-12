const mongoose = require("mongoose");

const sensorReadingSchema = new mongoose.Schema(
    {
        nodeId: {
            type: String,
            required: true
        },
        pm25: {
            type: Number,
            required: true
        },
        pm10: {
            type: Number,
            required: true
        },
        temperature: {
            type: Number,
            required: true
        },
        humidity: {
            type: Number,
            required: true
        },
        battery: {
            type: Number,
            required: true
        },
        fanSpeed: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("SensorReading", sensorReadingSchema);
