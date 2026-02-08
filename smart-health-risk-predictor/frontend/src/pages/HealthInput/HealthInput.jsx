import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Moon, Zap, Activity, Smartphone, Info } from 'lucide-react';

export default function HealthInput() {
    const [stressLevel, setStressLevel] = useState(5);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Daily Health Check-in</CardTitle>
                    <CardDescription>
                        Enter your health data for today to get accurate risk predictions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">

                    <div className="space-y-4">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Moon className="w-4 h-4 text-indigo-500" />
                            Sleep Duration (hours)
                        </label>
                        <div className="flex items-center gap-4">
                            <input type="range" min="0" max="12" step="0.5" className="flex-1 accent-indigo-500" />
                            <span className="w-12 text-center font-bold">7.5 h</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Zap className="w-4 h-4 text-orange-500" />
                            Physical Activity (steps)
                        </label>
                        <input
                            type="number"
                            placeholder="0"
                            className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Activity className="w-4 h-4 text-red-500" />
                            Stress Level (1-10)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={stressLevel}
                                onChange={(e) => setStressLevel(e.target.value)}
                                className="flex-1 accent-red-500"
                            />
                            <span className="w-12 text-center font-bold text-lg">{stressLevel}</span>
                        </div>
                        <p className="text-xs text-gray-500 text-right">
                            {stressLevel <= 3 ? 'Low Stress' : stressLevel <= 7 ? 'Moderate Stress' : 'High Stress'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-blue-500" />
                            Screen Time (hours)
                        </label>
                        <input
                            type="number"
                            placeholder="0"
                            className="flex h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>

                </CardContent>
                <CardFooter className="flex justify-between items-center bg-gray-50/50 p-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Info className="w-4 h-4" />
                        <span>All data is stored locally.</span>
                    </div>
                    <Button>Save Data</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
