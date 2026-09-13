import {
  AreaChart,
  Area,
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
  color = "#0f172a",
}) {
  const latestValue =
    data?.length > 0
      ? Number(data[data.length - 1]?.[dataKey] ?? 0)
      : 0;

  const formattedValue =
    latestValue < 1
      ? latestValue.toFixed(3)
      : latestValue.toFixed(1);

  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">

      {/* HEADER */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />

            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color }}
            >
              Live monitoring
            </p>
          </div>

          <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
            {title}
          </h3>
        </div>

        {/* CURRENT VALUE */}
        <div className="text-right">
          <p
            className="text-2xl font-semibold tracking-tight"
            style={{ color }}
          >
            {formattedValue}

            <span className="ml-1 text-sm font-medium text-slate-400">
              {unit}
            </span>
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Current
          </p>
        </div>
      </div>

      {/* CHART */}
      <div className="mt-5 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 8,
              left: -20,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient
                id={`gradient-${dataKey}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={color}
                  stopOpacity={0.25}
                />

                <stop
                  offset="100%"
                  stopColor={color}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="time"
              interval="preserveStartEnd"
              tick={{
                fontSize: 10,
                fill: "#94a3b8",
              }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{
                fontSize: 10,
                fill: "#94a3b8",
              }}
              axisLine={false}
              tickLine={false}
              width={35}
            />

            <Tooltip
              cursor={{
                stroke: color,
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              contentStyle={{
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                boxShadow:
                  "0 10px 30px rgba(15, 23, 42, 0.10)",
                padding: "10px 12px",
              }}
              labelStyle={{
                color: "#64748b",
                fontSize: 11,
                marginBottom: 4,
              }}
              itemStyle={{
                color,
                fontWeight: 600,
                fontSize: 13,
              }}
              formatter={(value) => [
                `${Number(value).toFixed(2)} ${unit}`,
                title,
              ]}
            />

            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#gradient-${dataKey})`}
              fillOpacity={1}
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: color,
                fill: "#ffffff",
              }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}