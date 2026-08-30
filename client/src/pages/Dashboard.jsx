import { useEffect, useState } from "react";
import {
  Thermometer,
  Droplets,
  Activity,
  Wind,
  Wifi,
} from "lucide-react";
import socket from "../services/socket";

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    const handleTelemetry = (data) => {
      setTelemetry(data);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("telemetry", handleTelemetry);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("telemetry", handleTelemetry);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Smart Air Purifier
          </h1>

          <p className="text-slate-400 mt-1">
            Real-time air quality monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />

          <span>
            {connected ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {!telemetry ? (
        <p className="text-slate-400">
          Waiting for sensor data...
        </p>
      ) : (
        <>
          {/* Device */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <Wifi size={22} />

              <div>
                <p className="text-sm text-slate-400">
                  Device
                </p>

                <p className="font-semibold">
                  {telemetry.deviceId}
                </p>
              </div>
            </div>
          </div>

          {/* Sensor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Temperature */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <Thermometer />

              <p className="text-slate-400 mt-4">
                Temperature
              </p>

              <p className="text-3xl font-bold mt-2">
                {telemetry.temperature}°C
              </p>
            </div>

            {/* Humidity */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <Droplets />

              <p className="text-slate-400 mt-4">
                Humidity
              </p>

              <p className="text-3xl font-bold mt-2">
                {telemetry.humidity}%
              </p>
            </div>

            {/* MQ135 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <Activity />

              <p className="text-slate-400 mt-4">
                Gas Index
              </p>

              <p className="text-3xl font-bold mt-2">
                {telemetry.mq135Raw}
              </p>

              <p className="text-sm text-slate-400 mt-2">
                {telemetry.mq135Voltage} V
              </p>
            </div>

            {/* Dust */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <Wind />

              <p className="text-slate-400 mt-4">
                Dust Density
              </p>

              <p className="text-3xl font-bold mt-2">
                {telemetry.dustDensity}
              </p>

              <p className="text-sm text-slate-400 mt-2">
                mg/m³
              </p>
            </div>

          </div>

          {/* Sensor Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mt-6">

            <h2 className="text-xl font-semibold mb-5">
              Sensor Details
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

              <div>
                <p className="text-slate-400 text-sm">
                  MQ-135 Raw
                </p>
                <p className="text-xl font-semibold">
                  {telemetry.mq135Raw}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">
                  MQ-135 Voltage
                </p>
                <p className="text-xl font-semibold">
                  {telemetry.mq135Voltage} V
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">
                  Dust Raw
                </p>
                <p className="text-xl font-semibold">
                  {telemetry.dustRaw}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-sm">
                  Dust Voltage
                </p>
                <p className="text-xl font-semibold">
                  {telemetry.dustVoltage} V
                </p>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}