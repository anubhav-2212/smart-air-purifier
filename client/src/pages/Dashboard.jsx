import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Droplets,
  Fan,
  Gauge,
  Thermometer,
  Wind,
  Wifi,
} from "lucide-react";

import socket from "../services/socket";
import SensorChart from "../components/SensorChart";

const DEVICE_ID = "esp32-air-001";
const API_BASE = "http://localhost:9000";

function SensorCard({ icon, label, value, unit, description }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>

          <div className="mt-3 flex items-baseline gap-1">
            <p className="text-3xl font-semibold tracking-tight text-slate-950">
              {value}
            </p>

            {unit && (
              <span className="text-sm font-medium text-slate-400">
                {unit}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

// function getAirQuality(dustDensity, mq135Raw) {
//   const dustScore = Math.min(
//     (Number(dustDensity || 0) / 0.15) * 100,
//     100
//   );

//   const gasScore = Math.min(
//     (Number(mq135Raw || 0) / 2500) * 100,
//     100
//   );

//   const score = Math.round(Math.max(dustScore, gasScore));

//   if (score <= 25) {
//     return {
//       score,
//       label: "Good",
//       description: "Air quality looks good",
//       className: "bg-emerald-50 text-emerald-700 border-emerald-200",
//     };
//   }

//   if (score <= 50) {
//     return {
//       score,
//       label: "Moderate",
//       description: "Air quality is acceptable",
//       className: "bg-amber-50 text-amber-700 border-amber-200",
//     };
//   }

//   if (score <= 75) {
//     return {
//       score,
//       label: "Poor",
//       description: "Consider increasing purification",
//       className: "bg-orange-50 text-orange-700 border-orange-200",
//     };
//   }

//   return {
//     score,
//     label: "Very Poor",
//     description: "High pollution detected",
//     className: "bg-rose-50 text-rose-700 border-rose-200",
//   };
// }

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState(null);
  const [connected, setConnected] = useState(false);

  const [historicalData, setHistoricalData] = useState([]);
  const [liveData, setLiveData] = useState([]);
  const [range, setRange] = useState("7d");

  /*
   * ------------------------------------------------
   * SOCKET.IO
   * ------------------------------------------------
   */

  useEffect(() => {
    const handleConnect = () => {
      console.log("Socket connected:", socket.id);
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setConnected(false);
    };

    const handleTelemetry = (data) => {
      console.log("LIVE TELEMETRY:", data);

      setTelemetry(data);

      const point = {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        temperature: Number(data.temperature ?? 0),
        humidity: Number(data.humidity ?? 0),
        dustDensity: Number(data.dustDensity ?? 0),
        mq135Raw: Number(data.mq135Raw ?? 0),
      };

      setLiveData((previous) => [...previous, point].slice(-30));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("telemetry", handleTelemetry);

    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("telemetry", handleTelemetry);
    };
  }, []);

  /*
   * ------------------------------------------------
   * HISTORICAL DATA
   * ------------------------------------------------
   */

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/history?deviceId=${DEVICE_ID}&range=${range}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          console.error("Historical data request failed:", result);
          return;
        }

        const formattedData = result.data.map((item) => ({
          time: new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          temperature: Number(item.temperature ?? 0),
          humidity: Number(item.humidity ?? 0),
          dustDensity: Number(item.dustDensity ?? 0),
          mq135Raw: Number(item.mq135Raw ?? 0),
          airQuality: item.airQuality,
        }));

        setHistoricalData(formattedData);
        setLiveData([]);

        console.log("HISTORICAL DATA:", result);
      } catch (error) {
        console.error("Historical data error:", error);
      }
    };

    fetchHistoricalData();
  }, [range]);

  /*
   * ------------------------------------------------
   * FAN CONTROL
   * ------------------------------------------------
   */

  const [fanMode, setFanMode] = useState("MANUAL");
  const [fanSpeed, setFanSpeed] = useState(0);
  const [fanStatus, setFanStatus] = useState("Ready");
  const [fanLoading, setFanLoading] = useState(false);

  // Smoothed pollution score for stable Auto mode.
  const [smoothedAirScore, setSmoothedAirScore] = useState(0);

  // Last speed actually sent to the backend.
  const [appliedFanSpeed, setAppliedFanSpeed] = useState(0);

  const lastAutoCommandRef = useRef(null);
  const lastAutoCommandTimeRef = useRef(0);
  const autoRampRef = useRef(null);

  const sendFanCommand = async (speed, source = "manual") => {
    const safeSpeed = Math.max(0, Math.min(100, Math.round(Number(speed))));

    // Prevent duplicate automatic commands.
    if (
      source === "auto" &&
      lastAutoCommandRef.current === safeSpeed &&
      Date.now() - lastAutoCommandTimeRef.current < 15000
    ) {
      return;
    }

    if (source === "auto") {
      lastAutoCommandRef.current = safeSpeed;
      lastAutoCommandTimeRef.current = Date.now();
    }

    setFanLoading(true);
    setFanStatus(source === "auto" ? "Adjusting..." : "Sending...");

    try {
      const response = await fetch(`${API_BASE}/api/fan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceId: DEVICE_ID,
          speed: safeSpeed,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to set fan speed");
      }

      setAppliedFanSpeed(safeSpeed);
      setFanSpeed(safeSpeed);

      setFanStatus(
        source === "auto"
          ? `Auto: ${safeSpeed}%`
          : `Set to ${safeSpeed}%`
      );
    } catch (error) {
      console.error("Fan control error:", error);
      setFanStatus("Command failed");

      if (source === "auto") {
        lastAutoCommandRef.current = null;
      }
    } finally {
      setFanLoading(false);
    }
  };

  const handleManualFanApply = () => {
    sendFanCommand(fanSpeed, "manual");
  };

  /*
   * SMART AUTO CONTROLLER
   *
   * - Smooths sensor noise
   * - Uses hysteresis to prevent oscillation
   * - Converts pollution severity into target speed
   * - Changes speed gradually by 5%
   */

  const calculateAutoTarget = (score, currentSpeed) => {
    let target;

    if (currentSpeed < 30) {
      if (score <= 22) target = 20;
      else if (score <= 47) target = 35;
      else if (score <= 72) target = 60;
      else target = 90;
    } else if (currentSpeed < 55) {
      if (score <= 18) target = 20;
      else if (score <= 44) target = 35;
      else if (score <= 70) target = 60;
      else target = 90;
    } else if (currentSpeed < 80) {
      if (score <= 20) target = 30;
      else if (score <= 48) target = 45;
      else if (score <= 73) target = 65;
      else target = 95;
    } else {
      if (score <= 18) target = 35;
      else if (score <= 45) target = 50;
      else if (score <= 70) target = 70;
      else target = 100;
    }

    return Math.max(20, Math.min(100, target));
  };

  // Smooth incoming air-quality scores.
  useEffect(() => {
    if (fanMode !== "AUTO" || !telemetry) return;

    const quality = telemetry.airQuality;

if (!quality) return;

    setSmoothedAirScore((previous) => {
      if (previous === 0) return quality.score;

      // 75% previous + 25% new reading.
      return previous * 0.75 + quality.score * 0.25;
    });
  }, [
    fanMode,
    telemetry?.dustDensity,
    telemetry?.mq135Raw,
  ]);

  // Gradually move the fan toward the calculated target.
  useEffect(() => {
    if (fanMode !== "AUTO" || !telemetry) return;

    const score = Math.round(smoothedAirScore);

    if (!Number.isFinite(score)) return;

    const targetSpeed = calculateAutoTarget(
      score,
      appliedFanSpeed
    );

    if (targetSpeed === appliedFanSpeed) return;

    const difference = targetSpeed - appliedFanSpeed;

    // Maximum 5% change per automatic adjustment.
    const nextSpeed =
      appliedFanSpeed +
      Math.sign(difference) *
      Math.min(Math.abs(difference), 5);

    clearTimeout(autoRampRef.current);

    autoRampRef.current = setTimeout(() => {
      sendFanCommand(nextSpeed, "auto");
    }, 1500);

    return () => clearTimeout(autoRampRef.current);
  }, [
    fanMode,
    smoothedAirScore,
    appliedFanSpeed,
  ]);

  const handleModeChange = (mode) => {
    setFanMode(mode);
    clearTimeout(autoRampRef.current);

    if (mode === "AUTO") {
      setFanStatus("Auto mode enabled");
      lastAutoCommandRef.current = null;
      setSmoothedAirScore(0);
    } else {
      setFanStatus("Manual mode enabled");
    }
  };

  /*
   * ------------------------------------------------
   * COMBINE HISTORICAL + LIVE DATA
   * ------------------------------------------------
   */

  const graphData = [...historicalData, ...liveData].slice(-30);

  /*
   * ------------------------------------------------
   * AIR QUALITY
   * ------------------------------------------------
   */

  const latestHistorical =
    historicalData.length > 0
      ? historicalData[historicalData.length - 1]
      : null;

  const currentData = telemetry || latestHistorical;

 const airQuality = currentData?.airQuality
  ? {
      score: currentData.airQuality.score,
      label: currentData.airQuality.level,
      description:
        currentData.airQuality.level === "Good"
          ? "Air quality looks good"
          : currentData.airQuality.level === "Moderate"
          ? "Air quality is acceptable"
          : currentData.airQuality.level === "Poor"
          ? "Consider increasing purification"
          : "High pollution detected",
      className:
        currentData.airQuality.level === "Good"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : currentData.airQuality.level === "Moderate"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : currentData.airQuality.level === "Poor"
          ? "bg-orange-50 text-orange-700 border-orange-200"
          : "bg-rose-50 text-rose-700 border-rose-200",
    }
  : null;

  /*
   * ------------------------------------------------
   * UI
   * ------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Smart Air Monitoring
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Air Purifier Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Real-time environmental monitoring
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                connected ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Purifier
              </p>

              <p className="text-sm font-semibold text-slate-950">
                {connected ? "Online" : "Offline"}
              </p>
            </div>

            <Wifi
              size={18}
              className={
                connected ? "text-emerald-600" : "text-rose-500"
              }
            />
          </div>
        </header>

        {/* WAITING FOR DATA */}
        {!currentData ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <Activity
              className="mx-auto text-slate-400"
              size={32}
            />

            <p className="mt-4 text-sm font-medium text-slate-600">
              Waiting for sensor data...
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Make sure the ESP32 is connected.
            </p>
          </section>
        ) : (
          <>
            {/* AQ + SENSOR CARDS */}
            <section className="space-y-4">

              {/* AQ SCORE */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Estimated Air Quality
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Based on dust + MQ-135 readings
                    </p>
                  </div>

                  <div className="mt-4 flex items-end gap-3 sm:mt-0">
                    <span className="text-6xl font-semibold tracking-tight text-slate-950">
                      {airQuality.score}
                    </span>

                    <span className="mb-2 text-sm text-slate-400">
                      / 100
                    </span>

                    <span
                      className={`mb-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${airQuality.className}`}
                    >
                      {airQuality.label}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-500">
                  {airQuality.description}
                </p>
              </div>

              {/* SENSOR CARDS */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <SensorCard
                  icon={<Thermometer size={20} />}
                  label="Temperature"
                  value={Number(currentData.temperature ?? 0).toFixed(1)}
                  unit="°C"
                  description="Current temperature"
                />

                <SensorCard
                  icon={<Droplets size={20} />}
                  label="Humidity"
                  value={Number(currentData.humidity ?? 0).toFixed(1)}
                  unit="%"
                  description="Relative humidity"
                />

                <SensorCard
                  icon={<Activity size={20} />}
                  label="MQ-135 Gas"
                  value={currentData.mq135Raw}
                  description={`${currentData.mq135Voltage ?? 0} V sensor output`}
                />

                <SensorCard
                  icon={<Wind size={20} />}
                  label="Dust Density"
                  value={Number(currentData.dustDensity ?? 0).toFixed(3)}
                  unit="mg/m³"
                  description="GP2Y10 reading"
                />

              </div>
            </section>

            {/* HISTORY */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Monitoring
                  </p>

                  <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                    Environmental trends
                  </h2>
                </div>

                {/* RANGE BUTTONS */}
                <div className="flex w-fit gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  {[
                    ["1h", "1H"],
                    ["6h", "6H"],
                    ["24h", "24H"],
                    ["7d", "7D"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setRange(value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        range === value
                          ? "bg-slate-950 text-white"
                          : "text-slate-500 hover:bg-white hover:text-slate-950"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CHARTS */}
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

                <SensorChart
                  data={graphData}
                  dataKey="temperature"
                  title="Temperature"
                  unit="°C"
                 color="#3b82f6"
                />

                <SensorChart
                  data={graphData}
                  dataKey="humidity"
                  title="Humidity"
                  unit="%"
                  color="#3b82f6"
                />

                <SensorChart
                  data={graphData}
                  dataKey="dustDensity"
                  title="Dust Density"
                  unit="mg/m³"
                  color="#22c55e"
                />

                <SensorChart
                  data={graphData}
                  dataKey="mq135Raw"
                  title="MQ-135 Gas Index"
                  color="#a855f7"
                />

              </div>
            </section>

            {/* FAN + FILTER */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">

              {/* FAN */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                    <Fan size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Purification
                    </p>

                    <h2 className="text-lg font-semibold text-slate-950">
                      Fan Control
                    </h2>
                  </div>
                </div>

                {/* MODE */}
                <div className="mt-6">
                  <p className="text-sm text-slate-500">Control mode</p>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      onClick={() => handleModeChange("MANUAL")}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        fanMode === "MANUAL"
                          ? "bg-slate-950 text-white"
                          : "text-slate-500 hover:bg-white hover:text-slate-950"
                      }`}
                    >
                      Manual
                    </button>

                    <button
                      onClick={() => handleModeChange("AUTO")}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        fanMode === "AUTO"
                          ? "bg-slate-950 text-white"
                          : "text-slate-500 hover:bg-white hover:text-slate-950"
                      }`}
                    >
                      Auto
                    </button>
                  </div>
                </div>

                {/* SPEED */}
                <div className="mt-6">

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Fan speed
                    </span>

                    <span className="text-2xl font-semibold text-slate-950">
                      {fanSpeed}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={fanSpeed}
                    onChange={(event) =>
                      setFanSpeed(Number(event.target.value))
                    }
                    disabled={fanMode === "AUTO"}
                    className="mt-4 h-2 w-full cursor-pointer accent-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                  />

                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>

                  <button
                    onClick={handleManualFanApply}
                    disabled={fanMode === "AUTO" || fanLoading}
                    className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {fanLoading ? "Sending..." : "Apply Fan Speed"}
                  </button>
                </div>

                {/* AUTO INFO */}
                {fanMode === "AUTO" && (
                  <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Automatic control
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      Uses smoothed pollution readings, hysteresis, and
                      gradual speed changes to keep the fan stable.
                    </p>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-white p-2">
                        <p className="font-semibold text-slate-700">Smoothed</p>
                        <p className="mt-1 text-slate-400">Noise reduced</p>
                      </div>

                      <div className="rounded-lg bg-white p-2">
                        <p className="font-semibold text-slate-700">Stable</p>
                        <p className="mt-1 text-slate-400">Hysteresis</p>
                      </div>

                      <div className="rounded-lg bg-white p-2">
                        <p className="font-semibold text-slate-700">Gradual</p>
                        <p className="mt-1 text-slate-400">5% steps</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                      <span className="text-slate-400">
                        Smoothed air score
                      </span>

                      <span className="font-semibold text-slate-700">
                        {Math.round(smoothedAirScore)} / 100
                      </span>
                    </div>
                  </div>
                )}

                {/* STATUS + RPM */}
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                    <Activity size={20} className="text-slate-500" />

                    <div>
                      <p className="text-xs text-slate-400">
                        Command status
                      </p>

                      <p className="font-semibold text-slate-950">
                        {fanStatus}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                    <Gauge size={20} className="text-slate-500" />

                    <div>
                      <p className="text-xs text-slate-400">
                        Fan RPM
                      </p>

                      <p className="font-semibold text-slate-950">
                        Not available
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* FILTER */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                    <Wind size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Maintenance
                    </p>

                    <h2 className="text-lg font-semibold text-slate-950">
                      Filter Status
                    </h2>
                  </div>

                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">

                  <p className="text-sm font-medium text-slate-600">
                    Predictive maintenance
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Filter health estimation will be available after airflow
                    data is added.
                  </p>

                </div>

              </div>
            </section>
          </>
        )}

      </div>
    </main>
  );
}
