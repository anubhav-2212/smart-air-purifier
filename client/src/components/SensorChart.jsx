import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SensorChart({
  data,
  dataKey,
  title,
  unit = "",
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      
      {/* HEADER */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Monitoring
        </p>

        <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
          {title}
        </h3>
      </div>

      {/* CHART */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 10,
              right: 15,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="time"
              type="category"
              interval={0}
              tick={{
                fontSize: 11,
                fill: "#64748b",
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fontSize: 11,
                fill: "#64748b",
              }}
              axisLine={false}
              tickLine={false}
              width={40}
            />

            <Tooltip
              cursor={{
                stroke: "#cbd5e1",
                strokeWidth: 1,
              }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                boxShadow:
                  "0 4px 12px rgba(15, 23, 42, 0.08)",
              }}
              labelStyle={{
                color: "#0f172a",
                fontWeight: 600,
              }}
              formatter={(value) => [
                `${value} ${unit}`,
                title,
              ]}
            />

            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#0f172a"
              strokeWidth={2}
              dot={{
                r: 4,
                strokeWidth: 2,
                fill: "#ffffff",
              }}
              activeDot={{
                r: 6,
              }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}