import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Download, Plus, FileText, Activity, Brain, Users } from 'lucide-react';
import { SummaryCard } from '../../components/reports/SummaryCard';
import { ReportTable } from '../../components/reports/ReportTable';
import { HealthCharts } from '../../components/reports/HealthCharts';
import { GenerateReportModal } from '../../components/reports/GenerateReportModal';

export default function Reports() {
    const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

    // Dummy Data
    const weeklyData = [
        { day: 'Mon', sleep: 6.5, stress: 4 },
        { day: 'Tue', sleep: 7.0, stress: 5 },
        { day: 'Wed', sleep: 5.5, stress: 7 },
        { day: 'Thu', sleep: 7.5, stress: 3 },
        { day: 'Fri', sleep: 6.0, stress: 6 },
        { day: 'Sat', sleep: 8.0, stress: 2 },
        { day: 'Sun', sleep: 8.5, stress: 2 },
    ];

    const riskDistribution = [
        { name: 'Low', value: 65, color: '#10B981' },
        { name: 'Med', value: 25, color: '#F59E0B' },
        { name: 'High', value: 10, color: '#EF4444' },
    ];

    const contributionData = [
        { name: 'Sleep', value: 40 },
        { name: 'Activity', value: 30 },
        { name: 'Stress', value: 30 }, // Fixed to 100% total roughly
    ];

    const reports = [
        { id: 'RPT-001', studentName: 'Alex Johnson', date: 'Oct 24, 2023', riskLevel: 'High', status: 'Completed' },
        { id: 'RPT-002', studentName: 'Sarah Williams', date: 'Oct 23, 2023', riskLevel: 'Low', status: 'Completed' },
        { id: 'RPT-003', studentName: 'Michael Brown', date: 'Oct 22, 2023', riskLevel: 'Medium', status: 'Pending Review' },
        { id: 'RPT-004', studentName: 'Emily Davis', date: 'Oct 21, 2023', riskLevel: 'Low', status: 'Completed' },
        { id: 'RPT-005', studentName: 'Jessica Miller', date: 'Oct 20, 2023', riskLevel: 'High', status: 'Flagged' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Reporting & Analytics</h2>
                    <p className="text-gray-500 mt-1">Monitor student health trends and generate detailed risk assessments.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2 text-gray-600">
                        <Download className="w-4 h-4" /> Export Data
                    </Button>
                    <Button className="gap-2 shadow-lg shadow-primary/20" onClick={() => setIsGenerateModalOpen(true)}>
                        <Plus className="w-4 h-4" /> Generate Report
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                    title="Total Reports"
                    value="1,284"
                    icon={FileText}
                    trend="up"
                    trendValue="+12%"
                />
                <SummaryCard
                    title="Active Students"
                    value="843"
                    icon={Users}
                    trend="up"
                    trendValue="+4%"
                />
                <SummaryCard
                    title="Avg Risk Score"
                    value="14.2"
                    icon={Activity}
                    trend="down"
                    trendValue="-2.1"
                />
                <SummaryCard
                    title="System Accuracy"
                    value="94.8%"
                    icon={Brain}
                    trend="neutral"
                    trendValue="0.0%"
                />
            </div>

            {/* Visualizations */}
            <HealthCharts
                weeklyData={weeklyData}
                riskDistribution={riskDistribution}
                contributionData={contributionData}
            />

            {/* Recent Reports Table */}
            <ReportTable reports={reports} />

            {/* Modals */}
            <GenerateReportModal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} />
        </div>
    );
}
