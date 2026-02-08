import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Button } from '../../components/ui/Button';
import { Download } from 'lucide-react';

export default function Reports() {
    const weeklyData = [
        { day: 'Mon', sleep: 6.5, stress: 4 },
        { day: 'Tue', sleep: 7.0, stress: 5 },
        { day: 'Wed', sleep: 5.5, stress: 7 },
        { day: 'Thu', sleep: 7.5, stress: 3 },
        { day: 'Fri', sleep: 6.0, stress: 6 },
        { day: 'Sat', sleep: 8.0, stress: 2 },
        { day: 'Sun', sleep: 8.5, stress: 2 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Your Health Reports</h2>
                <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" /> Export PDF
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Sleep Trends</CardTitle>
                        <CardDescription>Weekly sleep duration (hours)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} domain={[0, 10]} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="sleep" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Stress Levels</CardTitle>
                        <CardDescription>Daily stress tracking (1-10)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} domain={[0, 10]} />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="stress" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
