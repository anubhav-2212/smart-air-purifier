import SensorReading from "../models/SensorReading.model.js";

export const getHistory = async (req, res) => {
  try {
    const {
      deviceId = "esp32-air-001",
      range = "7d",
    } = req.query;

    const ranges = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };

    const duration = ranges[range];

    if (!duration) {
      return res.status(400).json({
        success: false,
        message: "Invalid range",
      });
    }

    const readings = await SensorReading
      .find({
        deviceId,
        createdAt: {
          $gte: new Date(Date.now() - duration),
        },
      })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: readings.length,
      range,
      deviceId,
      data: readings,
    });

  } catch (error) {
    console.error("Failed to fetch history:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sensor history",
    });
  }
};