import SensorReading from "../models/SensorReading.model.js";

export const receiveSensorData = async (req, res) => {
  try {
    const {
      deviceId,
      temperature,
      humidity,
      mq135Raw,
      mq135Voltage,
      dustRaw,
      dustVoltage,
      dustDensity,
    } = req.body;

    console.log("Sensor data received:", req.body);

    const requiredFields = [
      "deviceId",
      "temperature",
      "humidity",
      "mq135Raw",
      "mq135Voltage",
      "dustRaw",
      "dustVoltage",
      "dustDensity",
    ];

    const missingFields = requiredFields.filter(
      (field) =>
        !(field in req.body) ||
        req.body[field] === null
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Required sensor data is missing",
        missingFields,
      });
    }

    const sensorReading = await SensorReading.create({
      deviceId,
      temperature,
      humidity,
      mq135Raw,
      mq135Voltage,
      dustRaw,
      dustVoltage,
      dustDensity,
    });
    const io = req.app.get("io");

io.emit("telemetry", {
  deviceId,
  temperature,
  humidity,
  mq135Raw,
  mq135Voltage,
  dustRaw,
  dustVoltage,
  dustDensity,
});

    return res.status(201).json({
      success: true,
      message: "Sensor data received successfully",
      data: sensorReading,
    });

  } catch (error) {
    console.error("Failed to save sensor data:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save sensor data",
    });
  }
};