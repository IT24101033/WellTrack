import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export function SummaryCard({ title, value, icon: Icon, trend, trendValue, className }) {
    return (
        <Card className={cn("hover:shadow-md transition-shadow duration-200", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
                {Icon && <Icon className="h-4 w-4 text-primary" />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                {(trend || trendValue) && (
                    <div className="flex items-center text-xs mt-1">
                        {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-success mr-1" />}
                        {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />}
                        {trend === 'neutral' && <Minus className="h-3 w-3 text-gray-400 mr-1" />}

                        <span className={cn(
                            trend === 'up' ? "text-success" :
                                trend === 'down' ? "text-red-500" : "text-gray-500"
                        )}>
                            {trendValue}
                        </span>
                        <span className="text-gray-400 ml-1">from last month</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
