
import express from "express";
import cors from "cors";
import "dotenv/config"
import {connectDB} from "./config/db.js";
import sensorRoutes from "./routes/sensor.routes.js";

const app = express();

app.use(cors({
    origin:"*",
    
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        message: "Smart Air Purifier API is running"
    });
});

app.use("/api", sensorRoutes);

const PORT =  process.env.PORT || 1000;

const startServer = async () => {
    await connectDB();

   app.listen(9000, () => {
    console.log(`Server running on port ${PORT}`);
});
};

startServer();
