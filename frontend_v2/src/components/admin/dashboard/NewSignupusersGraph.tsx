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

const NewSignupusersGraph = () => {
  // const [isLoading, setIsLoading] = useState(true);
  // const router = useRouter();

  // useEffect(() => {
  //   const token = localStorage.getItem('adminToken')
  //   if (!token) {
  //     router.push('/admin/login')
  //     return
  //   }
  //   setIsLoading(false);
  // }, [router])

  // if (isLoading) {
  //   return (
  //     <div className="flex w-full h-full bg-[#F8F8F8] items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-black mx-auto"></div>
  //         <p className="mt-2 lg:mt-4 text-black text-sm lg:text-base">Loading dashboard...</p>
  //       </div>
  //     </div>
  //   )
  // }

  // Chart data matching the image trend
  const chartData = [
    { month: "JAN", value: 15 },
    { month: "FEB", value: 18 },
    { month: "MAR", value: 16 },
    { month: "APR", value: 24 },
    { month: "MAY", value: 28 },
    { month: "JUN", value: 32 },
    { month: "JUL", value: 35 },
    { month: "AUG", value: 30 },
    { month: "SEP", value: 25 },
    { month: "OCT", value: 20 },
    { month: "NOV", value: 22 },
    { month: "DEC", value: 18 },
  ];

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
                  {/* Graph Container */}
                  <div className="h-full min-h-80">
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
                          domain={[0, 40]}
                          ticks={[0, 10, 20, 30, 40]}
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
