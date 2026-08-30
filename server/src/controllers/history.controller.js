import SensorReading from "../models/SensorReading.model.js";

export const getHistory = async (req, res) => {
  try {
    const { deviceId } = req.query;

    const filter = deviceId ? { deviceId } : {};

    const readings = await SensorReading
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      count: readings.length,
      data: readings.reverse(),
    });

  } catch (error) {
    console.error("Failed to fetch history:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sensor history",
    });
  }
};