import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { AlertCircle, CheckCircle, Activity, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Prediction() {
    const [predicted, setPredicted] = useState(false);

    const riskData = [
        { name: 'Risk', value: 35, color: '#F59E0B' }, // Moderate risk
        { name: 'Safe', value: 65, color: '#E5E7EB' },
    ];

    const handlePredict = () => {
        setPredicted(true);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-4 pb-4">
                <h2 className="text-3xl font-bold text-gray-800">AI Health Prediction</h2>
                <p className="text-gray-500 max-w-xl mx-auto">
                    Our advanced AI analyzes your daily habits to predict potential health risks.
                    Review your latest data and run a prediction.
                </p>
            </div>

            {!predicted ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                            <Activity className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Ready to Predict</h3>
                        <p className="text-gray-500 mb-8">Based on your input from today (Sleep: 7.5h, Steps: 8432)</p>
                        <Button size="lg" onClick={handlePredict}>Predict My Health Risk</Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-t-4 border-t-yellow-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="text-yellow-500" />
                                Moderate Risk Detected
                            </CardTitle>
                            <CardDescription>Prediction Confidence: 92%</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800 text-sm">
                                Your screen time has increased significantly, and sleep quality is slightly below average.
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm">Contributing Factors:</h4>
                                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                                    <li>High screen time (&gt;6 hours)</li>
                                    <li>Irregular sleep schedule</li>
                                    <li>Moderate physical activity (Neutral)</li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full" onClick={() => setPredicted(false)}>Run New Prediction</Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Risk Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={riskData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            {riskData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                            <tspan x="50%" dy="-1em" fontSize="24" fontWeight="bold" fill="#F59E0B">35%</tspan>
                                            <tspan x="50%" dy="1.5em" fontSize="14" fill="#6B7280">Risk</tspan>
                                        </text>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
