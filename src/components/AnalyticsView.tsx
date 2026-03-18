"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";

interface AnalyticsViewProps {
    items: any[];
    properties: any;
}

export default function AnalyticsView({ items, properties }: AnalyticsViewProps) {
    // Find status property
    const statusProp = Object.values(properties).find((p: any) => p.type === "status" || p.type === "select") as any;
    const statusPropName = statusProp?.name || "";

    // Prepare Pie Chart data (Status Distribution)
    const statusCounts: Record<string, number> = {};
    items.forEach(item => {
        const status = item.properties[statusPropName]?.status?.name || item.properties[statusPropName]?.select?.name || "No Status";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#10b981", "#f59e0b", "#ef4444"];

    // Prepare Line Chart data (Creation volume over time - bucketed by date)
    const dateCounts: Record<string, number> = {};
    items.forEach(item => {
        const date = new Date(item.created_time).toLocaleDateString();
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    const lineData = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="h-full overflow-y-auto p-4 space-y-8 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pie Chart Card */}
                <div className="glass-card p-8 rounded-3xl border border-white/5 bg-black/20 flex flex-col h-[450px]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                            <PieChartIcon size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Status Distribution</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest ont-medium">Current pipeline volume</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Line Chart Card */}
                <div className="glass-card p-8 rounded-3xl border border-white/5 bg-black/20 flex flex-col h-[450px]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                            <TrendingUp size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Deal Growth</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">New contacts over time</p>
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineData}>
                                <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#000", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff" }}
                                    itemStyle={{ color: "#fff" }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#000" }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
