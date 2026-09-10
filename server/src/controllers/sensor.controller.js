import SensorReading from "../models/SensorReading.model.js";
const fanCommands = new Map();
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
export const setFanSpeed = async (req, res) => {
  try {
    const { deviceId, speed } = req.body;

    if (!deviceId || speed === undefined) {
      return res.status(400).json({
        success: false,
        message: "deviceId and speed are required",
      });
    }

    if (speed < 0 || speed > 100) {
      return res.status(400).json({
        success: false,
        message: "Fan speed must be between 0 and 100",
      });
    }

    // Store latest fan command
    fanCommands.set(deviceId, speed);

    return res.status(200).json({
      success: true,
      message: "Fan speed command stored",
      data: {
        deviceId,
        speed,
      },
    });

  } catch (error) {
    console.error("Failed to set fan speed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to set fan speed",
    });
  }
};

export const getFanSpeed = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const speed = fanCommands.get(deviceId) ?? 0;

    return res.status(200).json({
      success: true,
      data: {
        deviceId,
        speed,
      },
    });

  } catch (error) {
    console.error("Failed to get fan speed:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get fan speed",
    });
  }
};