
import mongoose from "mongoose";

const sensorReadingSchema = new mongoose.Schema(
    {
        deviceId: {
            type: String,
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
        mq135Raw: {
            type: Number,
            required: true
        },
        mq135Voltage: {
            type: Number,
            required: true
        },
        dustRaw: {
            type: Number,
            required: true
        },
        dustVoltage: {
            type: Number,
            required: true
        },
        dustDensity: {
            type: Number,
            required: true
        },
       
    },
    {
        timestamps: true
    }
);
const SensorReading = mongoose.model("SensorReading", sensorReadingSchema);

export default SensorReading;