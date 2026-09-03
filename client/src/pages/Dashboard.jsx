import { useEffect, useState } from "react";
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

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function getAirQuality(dustDensity, mq135Raw) {
  const dustScore = Math.min(
    (Number(dustDensity || 0) / 0.15) * 100,
    100
  );

  const gasScore = Math.min(
    (Number(mq135Raw || 0) / 2500) * 100,
    100
  );

  const score = Math.round(
    Math.max(dustScore, gasScore)
  );

  if (score <= 25) {
    return {
      score,
      label: "Good",
      description: "Air quality looks good",
      className:
        "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  if (score <= 50) {
    return {
      score,
      label: "Moderate",
      description: "Air quality is acceptable",
      className:
        "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  if (score <= 75) {
    return {
      score,
      label: "Poor",
      description: "Consider increasing purification",
      className:
        "bg-orange-50 text-orange-700 border-orange-200",
    };
  }

  return {
    score,
    label: "Very Poor",
    description: "High pollution detected",
    className:
      "bg-rose-50 text-rose-700 border-rose-200",
  };
}

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState(null);
  const [connected, setConnected] = useState(false);

  // Historical data from API
  const [historicalData, setHistoricalData] = useState([]);

  // Live data from Socket.IO
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

      // Update current sensor cards
      setTelemetry(data);

      // Create graph point
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

      // Only update live data
      setLiveData((previous) => {
        return [...previous, point].slice(-30);
      });
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("telemetry", handleTelemetry);

    // Socket may already be connected
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
   *
   * TEMPORARY TEST ROUTE
   *
   * Later replace this with /api/history.
   */

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch(
          `http://localhost:9000/api/history?deviceId=esp32-air-001&range=${range}`
        );

        if (!response.ok) {
          throw new Error(
            `HTTP error: ${response.status}`
          );
        }

        const result = await response.json();

        console.log(
          "HISTORICAL DATA:",
          result
        );

        if (!result.success) {
          console.error(
            "Historical data request failed:",
            result
          );
          return;
        }

        const formattedData = result.data.map(
          (item) => ({
           time: new Date(item.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
}),

            temperature: Number(
              item.temperature ?? 0
            ),

            humidity: Number(
              item.humidity ?? 0
            ),

            dustDensity: Number(
              item.dustDensity ?? 0
            ),

            mq135Raw: Number(
              item.mq135Raw ?? 0
            ),
          })
        );

        setHistoricalData(formattedData);
      } catch (error) {
        console.error(
          "Historical data error:",
          error
        );
      }
    };

    fetchHistoricalData();
  }, [range]);

  /*
   * ------------------------------------------------
   * COMBINE HISTORICAL + LIVE DATA
   * ------------------------------------------------
   */

  const graphData = [
    ...historicalData,
    ...liveData,
  ].slice(-30);

  /*
   * ------------------------------------------------
   * AIR QUALITY
   * ------------------------------------------------
   */

  const airQuality = telemetry
    ? getAirQuality(
        telemetry.dustDensity,
        telemetry.mq135Raw
      )
    : null;

  const latestHistorical =
  historicalData.length > 0
    ? historicalData[historicalData.length - 1]
    : null;

const currentData = telemetry || latestHistorical;
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
                connected
                  ? "bg-emerald-500"
                  : "bg-rose-500"
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
                connected
                  ? "text-emerald-600"
                  : "text-rose-500"
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
                  value={currentData.temperature}
                  unit="°C"
                  description="Current temperature"
                />

                <SensorCard
                  icon={<Droplets size={20} />}
                  label="Humidity"
                  value={currentData.humidity}
                  unit="%"
                  description="Relative humidity"
                />

                <SensorCard
                  icon={<Activity size={20} />}
                  label="MQ-135 Gas"
                  value={currentData.mq135Raw}
                  description={`${currentData.mq135Voltage} V sensor output`}
                />

                <SensorCard
                  icon={<Wind size={20} />}
                  label="Dust Density"
                  value={currentData.dustDensity}
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
                      onClick={() =>
                        setRange(value)
                      }
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
                />

                <SensorChart
                  data={graphData}
                  dataKey="humidity"
                  title="Humidity"
                  unit="%"
                />

                <SensorChart
                  data={graphData}
                  dataKey="dustDensity"
                  title="Dust Density"
                  unit="mg/m³"
                />

                <SensorChart
                  data={graphData}
                  dataKey="mq135Raw"
                  title="MQ-135 Gas Index"
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

                <div className="mt-6 flex items-center justify-between">

                  <span className="text-sm text-slate-500">
                    Control mode
                  </span>

                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                    AUTO
                  </span>

                </div>

                <div className="mt-6">

                  <div className="flex justify-between text-sm">

                    <span className="text-slate-500">
                      Fan speed
                    </span>

                    <span className="font-semibold text-slate-950">
                      Coming soon
                    </span>

                  </div>

                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-2 w-0 rounded-full bg-slate-900" />
                  </div>

                </div>

                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">

                  <Gauge
                    size={20}
                    className="text-slate-500"
                  />

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
                    Filter health estimation will be
                    available after airflow data is added.
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