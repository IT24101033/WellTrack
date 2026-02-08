import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Plus, Trash2, Edit2, Calendar as CalendarIcon } from 'lucide-react';

export default function Schedule() {
    const schedule = [
        { time: '07:00 AM', activity: 'Morning Jog', duration: '30 mins', type: 'exercise' },
        { time: '08:00 AM', activity: 'Healthy Breakfast', duration: '20 mins', type: 'meal' },
        { time: '09:00 AM', activity: 'Study Session', duration: '2 hours', type: 'work' },
        { time: '01:00 PM', activity: 'Lunch', duration: '45 mins', type: 'meal' },
        { time: '06:00 PM', activity: 'Gym / Workout', duration: '1 hour', type: 'exercise' },
        { time: '10:30 PM', activity: 'Sleep', duration: '8 hours', type: 'sleep' },
    ];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold">Daily Routine</h2>
                    <p className="text-gray-500 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" /> Today, Oct 24
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Add Activity
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 py-4">
                        {schedule.map((item, index) => (
                            <div key={index} className="relative pl-8">
                                {/* Dot indicator */}
                                <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white 
                            ${item.type === 'exercise' ? 'bg-orange-500' :
                                        item.type === 'meal' ? 'bg-green-500' :
                                            item.type === 'sleep' ? 'bg-indigo-500' : 'bg-blue-500'}`}>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between group">
                                    <div>
                                        <span className="text-sm font-bold text-gray-500 block mb-1">{item.time}</span>
                                        <h4 className="text-lg font-semibold">{item.activity}</h4>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{item.duration}</span>
                                    </div>
                                    <div className="flex gap-2 mt-2 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600">
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
