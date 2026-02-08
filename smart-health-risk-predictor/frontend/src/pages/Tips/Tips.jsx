import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowRight, Coffee, Moon, Utensils } from 'lucide-react';

export default function Tips() {
    const tips = [
        {
            category: 'Sleep',
            title: 'Optimize Your Sleep Cycle',
            description: 'Try to wake up at the same time every day, even on weekends, to regulate your circadian rhythm.',
            icon: Moon,
            color: 'bg-indigo-100 text-indigo-600'
        },
        {
            category: 'Diet',
            title: 'Brain Boosting Foods',
            description: 'Incorporate walnuts, blueberries, and fatty fish into your diet to improve cognitive function.',
            icon: Utensils,
            color: 'bg-green-100 text-green-600'
        },
        {
            category: 'Lifestyle',
            title: 'Digital Detox',
            description: 'Reduce screen time by 30 minutes before bed to improve sleep quality and reduce eye strain.',
            icon: Coffee, // using Coffee as placeholder for lifestyle
            color: 'bg-orange-100 text-orange-600'
        }
    ];

    return (
        <div className="space-y-8">
            <div className="text-center pb-4">
                <h2 className="text-3xl font-bold mb-2">Health Tips & Advice</h2>
                <p className="text-gray-500">Curated suggestions better your health journey.</p>
            </div>

            <div className="flex gap-2 justify-center pb-4">
                {['All', 'Sleep', 'Diet', 'Exercise', 'Mental Health'].map(filter => (
                    <Button key={filter} variant={filter === 'All' ? 'primary' : 'outline'} size="sm" className="rounded-full">
                        {filter}
                    </Button>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tips.map((tip, index) => (
                    <Card key={index} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
                        <div className={`h-32 ${tip.color} flex items-center justify-center`}>
                            <tip.icon className="h-12 w-12 opacity-50" />
                        </div>
                        <CardHeader>
                            <div className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1">{tip.category}</div>
                            <CardTitle className="text-xl">{tip.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-600">{tip.description}</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="link" className="px-0 flex items-center gap-1 text-primary">
                                Read more <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
                {/* Placeholder for more cards */}
                {[1, 2, 3].map(i => (
                    <Card key={`ph-${i}`} className="opacity-50">
                        <div className="h-32 bg-gray-100"></div>
                        <CardHeader>
                            <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                            <div className="h-6 w-40 bg-gray-200 rounded"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-16 w-full bg-gray-100 rounded"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
