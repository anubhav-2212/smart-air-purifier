const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const sensorRoutes = require("./routes/sensor.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Smart Air Purifier API is running"
    });
});

app.use("/api", sensorRoutes);

const PORT = process.env.PORT || 8000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();
