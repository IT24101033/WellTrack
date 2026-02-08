import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Bell, Check, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function Notifications() {
    const notifications = [
        {
            id: 1,
            type: 'alert',
            title: 'High Stress Detected',
            message: 'Your stress levels are trending higher than usual. Consider taking a break.',
            time: '2 hours ago',
            icon: AlertTriangle,
            color: 'text-red-500 bg-red-50'
        },
        {
            id: 2,
            type: 'reminder',
            title: 'Drink Water',
            message: 'It\'s been 3 hours since your last water intake log. Stay hydrated!',
            time: '4 hours ago',
            icon: Clock,
            color: 'text-blue-500 bg-blue-50'
        },
        {
            id: 3,
            type: 'success',
            title: 'Goal Achieved!',
            message: 'Congratulations! You reached your step goal for yesterday.',
            time: '1 day ago',
            icon: Check,
            color: 'text-green-500 bg-green-50'
        }
    ];

    return (
        <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Notifications</h2>
                <Button variant="ghost" size="sm">Mark all as read</Button>
            </div>

            <div className="space-y-4">
                {notifications.map((notification) => (
                    <Card key={notification.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                        <CardContent className="p-4 flex gap-4 items-start">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${notification.color}`}>
                                <notification.icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex justify-between">
                                    <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                                    <span className="text-xs text-gray-400">{notification.time}</span>
                                </div>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {notification.message}
                                </p>
                            </div>
                            {notification.type !== 'success' && (
                                <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {notifications.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        No new notifications.
                    </div>
                )}
            </div>
        </div>
    );
}
