import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';

export function HealthCharts({ weeklyData, riskDistribution, contributionData }) {
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
            {/* Weekly Health Trend - Line Chart */}
            <Card className="lg:col-span-2 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg text-primary-900">Weekly Health Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={weeklyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Line type="monotone" dataKey="sleep" name="Sleep (hrs)" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="stress" name="Stress Lvl" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                {/* Risk Distribution - Bar Chart */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-500">Risk Category Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[140px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={riskDistribution}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {riskDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Factors Contribution - Pie Chart */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-500">Risk Factor Contribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[140px] w-full flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={contributionData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={60}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {contributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Custom Legend */}
                            <div className="absolute right-0 flex flex-col gap-1 text-[10px] text-gray-500">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Sleep</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div>Activity</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div>Stress</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
