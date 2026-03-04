"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MONTH_LABELS = [
  "", "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const NewSignupusersGraph = ({
  monthlyBreakdown = [],
  duration = 12,
}: {
  monthlyBreakdown?: Array<{ _id: { year: number; month: number }; count: number }>;
  duration?: number;
}) => {
  // Build chart data from API monthlyBreakdown
  const chartData = (() => {
    if (!monthlyBreakdown.length) return [];

    return monthlyBreakdown
      .map((item) => ({
        month: MONTH_LABELS[item._id.month] || `${item._id.month}`,
        value: item.count,
        sortKey: item._id.year * 12 + item._id.month,
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ month, value }) => ({ month, value }));
  })();

  return (
    <div className="flex h-full w-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col gap-4">
          <div className="bg-white rounded-xl ">
            {/* Chart Area */}
            <div className="bg-white rounded-xl">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Graph Area */}
                <div className="flex-1 min-w-0">
                  {/* Graph Container - explicit height required for ResponsiveContainer on mobile */}
                  <div className="w-full h-[240px] sm:h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient
                            id="areaGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#FF5C00" />
                            <stop
                              offset="100%"
                              stopColor="rgba(249, 250, 251, 0)"
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#E5E5EF"
                          horizontal={false}
                        />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 10, fill: "#6B7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={false}
                          axisLine={false}
                          tickLine={false}
                          domain={[0, "auto"]}
                        />
                        <Tooltip
                          cursor={{
                            stroke: "#9291A5",
                            strokeWidth: 2,
                            strokeDasharray: "5 5",
                          }}
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-[#1E1B39] p-4 rounded-lg shadow-lg">
                                  <p className="font-semibold text-white mb-2">
                                    {label}
                                  </p>
                                  <p className="text-sm text-white">
                                    value: {payload[0]?.value}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#F67124"
                          fill="url(#areaGradient)"
                          strokeWidth={4}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NewSignupusersGraph;
