import React from 'react';
import { Activity, Moon, Zap, Smartphone, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';

export default function Dashboard() {
    const stats = [
        {
            title: "Sleep",
            value: "6h 30m",
            icon: Moon,
            color: "text-indigo-600",
            change: "+30m",
            trend: "up"
        },
        {
            title: "Steps",
            value: "8,432",
            icon: Zap,
            color: "text-orange-600",
            change: "-12%",
            trend: "down"
        },
        {
            title: "Screen Time",
            value: "4h 15m",
            icon: Smartphone,
            color: "text-blue-600",
            change: "-45m",
            trend: "down" // good trend
        },
        {
            title: "Stress Level",
            value: "Moderate",
            icon: Activity,
            color: "text-red-500",
            change: "Stable",
            trend: "neutral"
        }
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground pt-1 flex items-center">
                                {stat.change && (
                                    <span className={stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-500'}>
                                        {stat.change}
                                    </span>
                                )}
                                <span className="ml-1 text-gray-400">from yesterday</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Health Risk Status</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center">
                            <div className="relative h-40 w-40 flex items-center justify-center rounded-full border-8 border-green-100">
                                <div className="absolute inset-0 rounded-full border-8 border-green-500 border-t-transparent animate-spin-slow" style={{ animationDuration: '3s' }}></div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">LOW</div>
                                    <div className="text-xs text-gray-500">Risk Level</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Your activity history for today.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-center">
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none">Walked 5000 steps</p>
                                        <p className="text-xs text-gray-500">10:00 AM</p>
                                    </div>
                                    <div className="ml-auto font-medium text-sm">+250 cal</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
