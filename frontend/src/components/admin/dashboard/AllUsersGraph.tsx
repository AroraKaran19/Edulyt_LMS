"use client";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const AllUsersGraph = () => {
  // const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all"); // 'all', 'active', 'unactive'
  // const router = useRouter();

  // useEffect(() => {
  //     const token = localStorage.getItem('adminToken')
  //     if (!token) {
  //         router.push('/admin/login')
  //         return
  //     }
  //     setIsLoading(false);
  // }, [router])

  // if (isLoading) {
  //     return (
  //         <div className="flex w-full h-full bg-[#F8F8F8] items-center justify-center">
  //             <div className="text-center">
  //                 <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-black mx-auto"></div>
  //                 <p className="mt-2 lg:mt-4 text-black text-sm lg:text-base">Loading dashboard...</p>
  //             </div>
  //         </div>
  //     )
  // }

  // Chart data matching the first image
  const chartData = [
    { year: 2019, Active: 2800, Unactive: 2200 },
    { year: 2020, Active: 3000, Unactive: 2200 },
    { year: 2021, Active: 3900, Unactive: 3500 },
    { year: 2022, Active: 1800, Unactive: 700 },
  ];

  // Calculate counts for tabs
  const totalCount = chartData.reduce(
    (sum, item) => sum + item.Active + item.Unactive,
    0
  );
  const activeCount = chartData.reduce((sum, item) => sum + item.Active, 0);
  const unactiveCount = chartData.reduce((sum, item) => sum + item.Unactive, 0);

  return (
    <div className="flex h-full w-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col gap-4">
          <div className="bg-white rounded-xl">
            {/* Toggle Tabs */}
            <div className="flex gap-4">
              <button
                type="button"
                title="All Users"
                onClick={() => setSelectedTab("all")}
                className={`py-2 text-sm font-medium transition-colors ${
                  selectedTab === "all"
                    ? "text-[#F67124] border-b-2 font-bold text-base"
                    : "text-[#6B7280] hover:text-[#374151]"
                }`}
              >
                All
                <span className="bg-[#EFF4FF] rounded-full px-2 py-1 ml-1 text-sm text-[#6B7280]">
                  {Math.round(totalCount / 1000)}k
                </span>
              </button>
              <button
                type="button"
                title="Active Users"
                onClick={() => setSelectedTab("active")}
                className={`py-2 text-sm font-medium transition-colors ${
                  selectedTab === "active"
                    ? "text-[#F67124] border-b-2 font-bold text-base"
                    : "text-[#6B7280] hover:text-[#374151]"
                }`}
              >
                Active{" "}
                <span className="bg-[#EFF4FF] rounded-full px-2 py-1 ml-1 text-sm text-[#6B7280]">
                  {Math.round(activeCount / 1000)}k
                </span>
              </button>
              <button
                type="button"
                title="Unactive Users"
                onClick={() => setSelectedTab("unactive")}
                className={`py-2 text-sm font-medium transition-colors ${
                  selectedTab === "unactive"
                    ? "text-[#F67124] border-b-2 font-bold text-base"
                    : "text-[#6B7280] hover:text-[#374151]"
                }`}
              >
                Unactive{" "}
                <span className="bg-[#EFF4FF] rounded-full px-2 py-1 ml-1 text-sm text-[#6B7280]">
                  {Math.round(unactiveCount / 1000)}k
                </span>
              </button>
            </div>
            {/* payment graph */}
            <div className="bg-white rounded-xl pt-4">
              <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Graph Area */}
                <div className="flex-1 min-w-0">
                  {/* Graph Container */}
                  <div className="h-full min-h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#E5E5EF"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="year"
                          tick={{ fontSize: 10, fill: "#6B7280" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#6B7280" }}
                          axisLine={false}
                          tickLine={false}
                          domain={[0, 4000]}
                          ticks={[0, 1000, 2000, 3000, 4000]}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-[#1E1B39] p-4 rounded-lg shadow-lg">
                                  {payload.map((entry, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-2 mb-1"
                                    >
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-sm text-white">
                                        {entry.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend
                          content={({ payload }) => (
                            <div className="flex justify-start items-center gap-4 mt-2">
                              {payload?.map((entry, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2"
                                >
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-sm text-gray-600">
                                    {entry.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        />
                        {selectedTab === "all" && (
                          <Bar
                            dataKey="Active"
                            fill="#4323F7"
                            barSize={20}
                            radius={[4, 4, 4, 4]}
                          />
                        )}
                        {selectedTab === "all" && (
                          <Bar
                            dataKey="Unactive"
                            fill="#F5742C"
                            barSize={20}
                            radius={[4, 4, 4, 4]}
                          />
                        )}
                        {selectedTab === "active" && (
                          <Bar
                            dataKey="Active"
                            fill="#4323F7"
                            barSize={20}
                            radius={[4, 4, 4, 4]}
                          />
                        )}
                        {selectedTab === "unactive" && (
                          <Bar
                            dataKey="Unactive"
                            fill="#F5742C"
                            barSize={20}
                            radius={[4, 4, 4, 4]}
                          />
                        )}
                      </BarChart>
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

export default AllUsersGraph;
