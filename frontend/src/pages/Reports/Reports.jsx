import React, { useState, useEffect } from 'react';
import { Download, PlusCircle, Sparkles, TrendingUp, FileText, BarChart3, Moon, Activity, Heart, Loader2 } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import HealthPDFImportCard from '../../components/HealthPDFImportCard/HealthPDFImportCard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getUserReports, getUserDashboard, createReport } from '../../services/reportService';
import { fetchHealthEntries } from '../../services/healthService';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const GlassTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass-sm px-3 py-2 text-xs" style={{ color: 'var(--text-primary)' }}>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} style={{ color: p.color }}>{p.name}: <b>{p.value}</b></p>
            ))}
        </div>
    );
};

const initialWeekData = [
    { day: 'Mon', sleep: 0, steps: 0, stress: 0, risk: 0 },
    { day: 'Tue', sleep: 0, steps: 0, stress: 0, risk: 0 },
    { day: 'Wed', sleep: 0, steps: 0, stress: 0, risk: 0 },
    { day: 'Thu', sleep: 0, steps: 0, stress: 0, risk: 0 },
    { day: 'Fri', sleep: 0, steps: 0, stress: 0, risk: 0 },
    { day: 'Sat', sleep: 0, steps: 0, stress: 0, risk: 0 },
    { day: 'Sun', sleep: 0, steps: 0, stress: 0, risk: 0 },
];

const initialReports = [];
const riskColor = r => r?.includes('Low') ? '#10b981' : r?.includes('Moderate') ? '#f59e0b' : '#ef4444';

const SummaryCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${color}18`, border: `1px solid ${color}22` }}>
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
        </div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
        <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {sub && <p className="text-xs mt-1 font-semibold" style={{ color }}>{sub}</p>}
    </div>
);

// ─── Heart Rate Chart (populated after PDF import) ─────────────────────────
function HeartRateChart({ hrData }) {
    if (!hrData || hrData.length === 0) return null;
    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4" style={{ color: '#ef4444' }} />
                <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Imported Heart Rate Trend
                </h2>
                <span
                    className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}
                >
                    {hrData.length} records
                </span>
            </div>
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={hrData} margin={{ left: -20, right: 8 }}>
                        <defs>
                            <linearGradient id="hrMinGr" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="hrMaxGr" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<GlassTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Line type="monotone" dataKey="hr_min" name="HR Min (bpm)" stroke="#10b981" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="hr_max" name="HR Max (bpm)" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function Reports() {
    const { user } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [selectedType, setSelectedType] = useState('Weekly Summary');
    const [customFrom, setCustomFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 14);
        return d.toISOString().slice(0, 10);
    });
    const [customTo, setCustomTo] = useState(() => new Date().toISOString().slice(0, 10));
    const [importedHRData, setImportedHRData] = useState([]);
    const [importSummary, setImportSummary] = useState(null);
    const [chartData, setChartData] = useState(initialWeekData);
    const [reportsData, setReportsData] = useState(initialReports);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        const loadDocs = async () => {
            if (!user?._id && !user?.id) {
                setLoading(false);
                return;
            }
            try {
                const uid = user.id || user._id;
                const token = localStorage.getItem('healthPredict_token');
                const authH = { Authorization: `Bearer ${token}` };

                // ── 1. Fetch saved reports ──────────────────────────────────
                const repRes = await getUserReports(uid);
                if (repRes.data?.success) {
                    const apiReps = repRes.data.data || [];
                    const mapped = apiReps.map(r => {
                        const rt = r.report_type;
                        const readableName = rt === 'weekly' ? 'Weekly Summary' : rt === 'monthly' ? 'Monthly Overview' : rt === 'custom' ? 'Custom Date Range' : 'Health Report';
                        return {
                        id: r._id,
                        name: readableName,
                        date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                        risk: (r.predicted_risk_level || 'Low').charAt(0).toUpperCase() + (r.predicted_risk_level || 'Low').slice(1) + ' Risk',
                        riskPct: r.predicted_risk_score != null ? (r.predicted_risk_score * 100).toFixed(1) : 0,
                        status: 'Saved'
                    }});
                    setReportsData(mapped);
                }

                // ── 2. Fetch dashboard stats ────────────────────────────────
                const dashRes = await getUserDashboard(uid);
                if (dashRes.data?.success) {
                    setDashboardStats(dashRes.data.data);
                }

                // ── 3. Fetch HealthEntries for the week chart ───────────────
                const healthRes = await fetchHealthEntries({ limit: 7 });
                if (healthRes.data?.success && healthRes.data.entries?.length > 0) {
                    const sorted = [...healthRes.data.entries].sort((a, b) => a.date.localeCompare(b.date));
                    const newChartData = sorted.map(e => ({
                        day: new Date(e.date).toLocaleDateString('en-US', { weekday: 'short' }),
                        sleep: e.physiological?.sleepHours || 0,
                        steps: e.activity?.stepsPerDay ? Math.round(e.activity.stepsPerDay / 100) / 10 : 0,
                        stress: e.psychological?.stressScore || 0,
                        risk: e.healthScore !== undefined ? Math.max(0, 100 - e.healthScore) : 0
                    }));
                    while(newChartData.length < 7) {
                        newChartData.unshift({ day: '-', sleep: 0, steps: 0, stress: 0, risk: 0 });
                    }
                    if (newChartData.length > 7) newChartData.splice(0, newChartData.length - 7);
                    setChartData(newChartData);
                }

                // ── 4. Restore analytics summary from DB (persists navigation) ──
                const summaryRes = await fetch(`${API_BASE}/reports/analytics-summary`, { headers: authH });
                const summaryJson = await summaryRes.json();
                if (summaryJson.success && summaryJson.data) {
                    const s = summaryJson.data;
                    setImportSummary({
                        total_records: s.total_records,
                        avg_hr: s.avg_hr,
                        min_hr: s.min_hr,
                        max_hr: s.max_hr,
                        exercise_sessions: s.exercise_sessions,
                        risk_score: null, // populated from hr-records below
                        risk_category: null,
                    });
                }

                // ── 5. Restore HR chart data from persisted HealthRecords ───
                const hrRes = await fetch(`${API_BASE}/reports/hr-records`, { headers: authH });
                const hrJson = await hrRes.json();
                if (hrJson.success && hrJson.data?.length > 0) {
                    setImportedHRData(hrJson.data);
                }

            } catch (err) {
                console.error('Failed to load reports', err);
            }
            setLoading(false);
        };
        loadDocs();
    }, [user]);

    // Called by HealthPDFImportCard after a successful import
    const handleImportSuccess = (apiResponse) => {
        if (apiResponse?.summary) {
            const riskData = apiResponse.risk || {};
            const riskScorePct = riskData.score != null ? riskData.score * 100 : null;
            const riskCategoryStr = riskData.level 
                ? riskData.level.charAt(0).toUpperCase() + riskData.level.slice(1) + ' Risk' 
                : null;
                
            const fullSummary = {
                ...apiResponse.summary,
                risk_score: riskScorePct,
                risk_category: riskCategoryStr
            };
            
            setImportSummary(fullSummary);
            
            const s = apiResponse.summary;
            const newPoint = {
                label: s.date_range?.split(' → ')[0] || 'Imported',
                hr_min: s.min_hr,
                hr_max: s.max_hr,
            };
            setImportedHRData(prev => [...prev, newPoint]);
            
            // Update charts dynamically with new risk score
            if (fullSummary.risk_score != null) {
                const latestRisk = parseFloat(fullSummary.risk_score);
                setChartData(prevData => {
                    const newData = [...prevData];
                    // Update latest day with the new imported risk score
                    newData[newData.length - 1] = { ...newData[newData.length - 1], risk: latestRisk };
                    return newData;
                });
            }
        }
    };

    const generateReportPDF = (report) => {
        const doc = new jsPDF();
        const isWeekly   = report.name === 'Weekly Summary';
        const isMonthly  = report.name === 'Monthly Overview';
        const isCustom   = report.name === 'Custom Date Range';

        // ── Accent colour per type ──────────────────────────────────────────
        const accentRGB  = isWeekly ? [59, 130, 246] : isMonthly ? [139, 92, 246] : [16, 185, 129];
        const accentHex  = isWeekly ? '#3b82f6'      : isMonthly ? '#8b5cf6'       : '#10b981';

        // ── Period label ────────────────────────────────────────────────────
        const periodLabel = isWeekly  ? 'Last 7 Days'
                          : isMonthly ? 'Last 30 Days'
                          : `${report.customFrom || '—'} → ${report.customTo || '—'}`;

        // ── Data rows (chart): weekly uses all 7, monthly repeats pattern ──
        const realDays = chartData.filter(d => d.day !== '-');
        const avgSteps = realDays.length ? Math.round(realDays.reduce((a, c) => a + c.steps * 1000, 0) / realDays.length) : 0;
        const avgSleep = realDays.length ? (realDays.reduce((a, c) => a + c.sleep, 0) / realDays.length).toFixed(1) : 0;
        const avgStress = realDays.length ? (realDays.reduce((a, c) => a + c.stress, 0) / realDays.length).toFixed(1) : 0;
        const avgRisk   = realDays.length ? (realDays.reduce((a, c) => a + c.risk, 0) / realDays.length).toFixed(1) : 0;

        // ── 1. Header ───────────────────────────────────────────────────────
        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42);
        const title = isWeekly  ? 'Weekly Health Summary'
                    : isMonthly ? 'Monthly Health Overview'
                    : 'Custom Range Health Report';
        doc.text(title, 14, 22);

        doc.setLineWidth(0.6);
        doc.setDrawColor(...accentRGB);
        doc.line(14, 28, 196, 28);

        // ── 2. Metadata ─────────────────────────────────────────────────────
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Report Type : ${report.name}`, 14, 37);
        doc.text(`Period      : ${periodLabel}`, 14, 43);
        doc.text(`Generated On: ${report.date}`, 14, 49);
        doc.text(`Patient     : ${user?.fullName || 'Registered User'}`, 14, 55);

        // ── 3. Risk Banner ──────────────────────────────────────────────────
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text('Executive Risk Summary', 14, 70);

        const isLow = report.risk?.includes('Low');
        const isMed = report.risk?.includes('Moderate');
        const riskRGB = isLow ? [16, 185, 129] : isMed ? [245, 158, 11] : [239, 68, 68];

        doc.setFillColor(...riskRGB);
        doc.roundedRect(14, 74, 182, 16, 3, 3, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(`Overall Health Risk: ${report.risk}   |   Risk Score: ${report.riskPct}%`, 20, 84);

        // ── 4. Heart Rate Summary (from PDF import) ─────────────────────────
        let curY = 100;
        if (importSummary?.avg_hr) {
            doc.setFontSize(13);
            doc.setTextColor(15, 23, 42);
            doc.text('Heart Rate Analysis (from Imported PDF)', 14, curY);
            autoTable(doc, {
                startY: curY + 5,
                head: [['Metric', 'Value']],
                body: [
                    ['Average Heart Rate', `${Number(importSummary.avg_hr).toFixed(1)} bpm`],
                    ['Min Heart Rate',     `${importSummary.min_hr} bpm`],
                    ['Max Heart Rate',     `${importSummary.max_hr} bpm`],
                    ['Exercise Sessions',  `${importSummary.exercise_sessions}`],
                    ['Total Records',      `${importSummary.total_records}`],
                ],
                theme: 'grid',
                headStyles: { fillColor: accentRGB },
                styles: { fontSize: 10, cellPadding: 3 },
                columnStyles: { 0: { fontStyle: 'bold' } },
            });
            curY = doc.lastAutoTable.finalY + 12;
        }

        // ── 5. Type-specific wearable data table ────────────────────────────
        const tableTitle = isWeekly  ? '7-Day Wearable Data Breakdown'
                         : isMonthly ? '30-Day Wearable Summary (Last 7 Days Synced)'
                         : 'Wearable Data for Selected Period';

        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(tableTitle, 14, curY);

        const tableBody = realDays.map(d => [
            d.day,
            `${(d.steps * 1000).toLocaleString()} steps`,
            `${d.sleep} hrs`,
            `${d.stress}/10`,
            `${d.risk.toFixed(1)}%`,
        ]);

        // For monthly, add a monthly averages summary row
        if (isMonthly && realDays.length > 0) {
            tableBody.push([
                '── Avg ──',
                `${avgSteps.toLocaleString()} steps`,
                `${avgSleep} hrs`,
                `${avgStress}/10`,
                `${avgRisk}%`,
            ]);
        }

        autoTable(doc, {
            startY: curY + 5,
            head: [['Day / Period', 'Activity', 'Sleep', 'Stress', 'Risk Impact']],
            body: tableBody.length > 0 ? tableBody : [['No synced data available', '-', '-', '-', '-']],
            theme: 'striped',
            headStyles: { fillColor: accentRGB },
            styles: { fontSize: 10, cellPadding: 3.5 },
            alternateRowStyles: { fillColor: [241, 245, 249] },
        });

        curY = doc.lastAutoTable.finalY + 12;

        // ── 6. Monthly-only: extra month summary block ───────────────────────
        if (isMonthly) {
            doc.setFontSize(13);
            doc.setTextColor(15, 23, 42);
            doc.text('Monthly Averages Overview', 14, curY);
            autoTable(doc, {
                startY: curY + 5,
                head: [['KPI', '30-Day Average']],
                body: [
                    ['Steps per Day',  `${avgSteps.toLocaleString()}`],
                    ['Sleep per Night', `${avgSleep} hrs`],
                    ['Stress Score',   `${avgStress} / 10`],
                    ['Risk Score',     `${avgRisk}%`],
                ],
                theme: 'grid',
                headStyles: { fillColor: accentRGB },
                styles: { fontSize: 10, cellPadding: 3 },
                columnStyles: { 0: { fontStyle: 'bold' } },
            });
            curY = doc.lastAutoTable.finalY + 12;
        }

        // ── 7. Custom-only: date range highlight block ───────────────────────
        if (isCustom) {
            doc.setFontSize(13);
            doc.setTextColor(15, 23, 42);
            doc.text('Selected Period Summary', 14, curY);
            autoTable(doc, {
                startY: curY + 5,
                head: [['KPI', 'Value']],
                body: [
                    ['Period',          periodLabel],
                    ['Avg Steps / Day', `${avgSteps.toLocaleString()}`],
                    ['Avg Sleep / Night', `${avgSleep} hrs`],
                    ['Avg Stress',      `${avgStress} / 10`],
                    ['Avg Risk Score',  `${avgRisk}%`],
                ],
                theme: 'grid',
                headStyles: { fillColor: accentRGB },
                styles: { fontSize: 10, cellPadding: 3 },
                columnStyles: { 0: { fontStyle: 'bold' } },
            });
            curY = doc.lastAutoTable.finalY + 12;
        }

        // ── 8. AI Insights ───────────────────────────────────────────────────
        if (curY < 255) {
            doc.setFontSize(13);
            doc.setTextColor(15, 23, 42);
            doc.text('AI Health Insights', 14, curY);

            const periodWord = isWeekly ? '7 days' : isMonthly ? '30 days' : 'the selected period';
            const hrPart = importSummary?.avg_hr
                ? `Your average resting heart rate is ${Number(importSummary.avg_hr).toFixed(1)} bpm. `
                : '';
            const insightText = `${hrPart}Over the last ${periodWord}, you averaged ${avgSteps.toLocaleString()} steps and ${avgSleep} hrs of sleep per night with a stress score of ${avgStress}/10. Your overall health trajectory corresponds to a ${report.risk} status. ${isLow ? 'Keep up your healthy habits!' : isMed ? 'Consider improving sleep and reducing stress.' : 'We recommend consulting a healthcare professional and reviewing your lifestyle habits.'}`;

            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            const insightLines = doc.splitTextToSize(insightText, 180);
            doc.text(insightLines, 14, curY + 7);
        }

        // ── Footer ───────────────────────────────────────────────────────────
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('Generated securely by Smart Health Risk Predictor Analytics. Do not share medical records publicly.', 14, 288);

        // ── Save ─────────────────────────────────────────────────────────────
        const safeName = report.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
        const dateStr  = new Date().toISOString().slice(0, 10);
        doc.save(`${safeName}_${dateStr}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b82f6' }} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Reports &amp; Analytics</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Your health trends at a glance</p>
                </div>
                <button onClick={() => setShowModal(true)} className="glass-btn flex items-center gap-2 px-4 py-2.5 text-sm">
                    <PlusCircle className="w-4 h-4" /> Generate Report
                </button>
            </div>

            {/* AI summary banner */}
            <div className="glass-card p-5 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.2))' }}>
                    <Sparkles className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI Weekly Summary</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {importSummary ? (
                            <>
                                Based on your imported PDF data ({importSummary.total_records || 'several'} records), 
                                your average heart rate is <strong>{(importSummary.avg_hr || 0).toFixed(1)} bpm</strong>. 
                                This brings your estimated health risk to <strong>{importSummary.risk_category || 'Low Risk'}</strong>. 
                                Keep up the good work and maintain a balanced lifestyle!
                            </>
                        ) : (
                            <>
                                No recent activity to analyze. Import a health PDF or sync your wearable device to generate your weekly AI summary!
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* ── PDF Import Card ──────────────────────────────────────── */}
            <HealthPDFImportCard onSuccess={handleImportSuccess} />

            {/* ── Imported HR Chart (shows after successful import) ─────── */}
            {importedHRData.length > 0 && (
                <HeartRateChart hrData={importedHRData} />
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={Moon} label="Avg Sleep" value={chartData.reduce((acc, c) => acc + c.sleep, 0) > 0 ? (chartData.reduce((acc, c) => acc + c.sleep, 0) / chartData.filter(c => c.sleep > 0).length).toFixed(1) + 'h' : '0.0h'} sub="Last 7 days" color="#6366f1" />
                <SummaryCard icon={Activity} label="Avg Steps" value={chartData.reduce((acc, c) => acc + c.steps * 1000, 0) > 0 ? Math.round(chartData.reduce((acc, c) => acc + c.steps * 1000, 0) / chartData.filter(c => c.steps > 0).length).toLocaleString() : '0'} sub="Last 7 days" color="#f97316" />
                <SummaryCard icon={TrendingUp} label="Avg Risk" value={dashboardStats?.average_risk_score != null ? `${(dashboardStats.average_risk_score * 100).toFixed(1)}%` : (importSummary ? `${importSummary.risk_score}%` : '0%')} sub={dashboardStats ? 'Overall Risk' : '—'} color="#10b981" />
                <SummaryCard icon={BarChart3} label="Reports Total" value={dashboardStats?.total_reports?.toString() || reportsData.length.toString()} sub="Total history" color="#3b82f6" />
            </div>

            {/* Charts */}
            <div className="grid gap-5 lg:grid-cols-2">
                {/* Sleep + Risk trend */}
                <div className="glass-card p-5">
                    <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Sleep vs Risk Score</h2>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ left: -20, right: 8 }}>
                                <defs>
                                    <linearGradient id="sleepGr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="riskGr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<GlassTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Area type="monotone" dataKey="sleep" name="Sleep (h)" stroke="#6366f1" fill="url(#sleepGr)" strokeWidth={2} dot={false} />
                                <Area type="monotone" dataKey="risk" name="Risk (%)" stroke="#f59e0b" fill="url(#riskGr)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Step / stress bars */}
                <div className="glass-card p-5">
                    <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Daily Steps &amp; Stress</h2>
                    <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ left: -20, right: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<GlassTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                <Bar dataKey="steps" name="Steps" fill="rgba(249,115,22,0.6)" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="stress" name="Stress" fill="rgba(239,68,68,0.5)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Reports table */}
            <div className="glass-card p-5">
                <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Recent Reports</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                {['Report Name', 'Date', 'Risk Level', 'Status', ''].map(h => (
                                    <th key={h} className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wide"
                                        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--glass-border)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reportsData.map(r => (
                                <tr key={r.id} className="transition-colors"
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td className="py-3 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                            {r.name}
                                        </div>
                                    </td>
                                    <td className="py-3 px-3" style={{ color: 'var(--text-muted)' }}>{r.date}</td>
                                    <td className="py-3 px-3">
                                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                                            style={{ background: `${riskColor(r.risk)}15`, color: riskColor(r.risk) }}>
                                            {r.risk} ({r.riskPct}%)
                                        </span>
                                    </td>
                                    <td className="py-3 px-3">
                                        <span className="text-xs px-2 py-0.5 rounded-full"
                                            style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>{r.status}</span>
                                    </td>
                                    <td className="py-3 px-3">
                                        <button onClick={() => generateReportPDF(r)} className="flex items-center gap-1 text-xs glass-btn-outline px-3 py-1.5">
                                            <Download className="w-3.5 h-3.5" /> PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Generate modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.3)' }}
                    onClick={() => setShowModal(false)}>
                    <div className="glass-card max-w-md w-full p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
                        <h2 className="font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Generate New Report</h2>
                        <div className="space-y-3">
                            {['Weekly Summary', 'Monthly Overview', 'Custom Date Range'].map(t => (
                                <button 
                                    key={t} 
                                    onClick={() => setSelectedType(t)}
                                    className="w-full text-left p-3 rounded-2xl text-sm font-medium transition-all duration-200"
                                    style={{ 
                                        background: selectedType === t ? 'rgba(59,130,246,0.1)' : 'var(--glass-bg)', 
                                        border: `1px solid ${selectedType === t ? '#3b82f6' : 'var(--glass-border)'}`, 
                                        color: 'var(--text-primary)' 
                                    }}
                                    onMouseEnter={e => { if(selectedType !== t) e.currentTarget.style.background = 'var(--glass-bg-hover)'; }}
                                    onMouseLeave={e => { if(selectedType !== t) e.currentTarget.style.background = 'var(--glass-bg)'; }}>
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Custom Date Range Picker */}
                        {selectedType === 'Custom Date Range' && (
                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>From</label>
                                    <input
                                        type="date"
                                        value={customFrom}
                                        max={customTo}
                                        onChange={e => setCustomFrom(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl text-sm"
                                        style={{
                                            background: 'var(--glass-bg)',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>To</label>
                                    <input
                                        type="date"
                                        value={customTo}
                                        min={customFrom}
                                        max={new Date().toISOString().slice(0, 10)}
                                        onChange={e => setCustomTo(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl text-sm"
                                        style={{
                                            background: 'var(--glass-bg)',
                                            border: '1px solid var(--glass-border)',
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end gap-3 mt-5">
                            <button className="glass-btn-outline px-4 py-2 text-sm" onClick={() => setShowModal(false)}>Cancel</button>
                            <button
                                disabled={generating}
                                className="glass-btn px-4 py-2 text-sm flex items-center gap-2"
                                onClick={async () => {
                                    const uid = user?.id || user?._id;
                                    if (!uid) return;
                                    setGenerating(true);

                                    // ── Compute date range per type ────────
                                    const now = new Date();
                                    let startDate, endDate = now.toISOString();
                                    if (selectedType === 'Weekly Summary') {
                                        const s = new Date(now);
                                        s.setDate(s.getDate() - 7);
                                        startDate = s.toISOString();
                                    } else if (selectedType === 'Monthly Overview') {
                                        const s = new Date(now);
                                        s.setDate(s.getDate() - 30);
                                        startDate = s.toISOString();
                                    } else {
                                        // Custom Date Range
                                        startDate = new Date(customFrom).toISOString();
                                        endDate   = new Date(customTo).toISOString();
                                    }

                                    let riskLevel = importSummary ? importSummary.risk_category : 'Low Risk';
                                    let riskPercentage = importSummary ? parseFloat(importSummary.risk_score || 25).toFixed(1) : '25.0';
                                    let rId = Date.now().toString();

                                    try {
                                        const apiReportType = selectedType === 'Weekly Summary' ? 'weekly' : selectedType === 'Monthly Overview' ? 'monthly' : 'custom';
                                        
                                        const res = await createReport({
                                            user_id: uid,
                                            report_type: apiReportType,
                                            start_date: startDate,
                                            end_date: endDate,
                                            health_data: [],
                                            predicted_risk_score: importSummary ? (parseFloat(importSummary.risk_score || 25) / 100).toFixed(4) : 0.25,
                                        });
                                        if (res.data?.success) {
                                            const r = res.data.data;
                                            rId = r._id;
                                            riskLevel = (r.predicted_risk_level || 'Low').charAt(0).toUpperCase() + (r.predicted_risk_level || 'Low').slice(1) + ' Risk';
                                            if (r.predicted_risk_score != null) riskPercentage = (r.predicted_risk_score * 100).toFixed(1);
                                        }
                                    } catch (e) { /* fallback */ }

                                    const newReport = {
                                        id: rId,
                                        name: selectedType,
                                        date: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                                        risk: riskLevel,
                                        riskPct: riskPercentage,
                                        status: 'Just Generated',
                                        // carry through for the PDF
                                        customFrom: selectedType === 'Custom Date Range' ? customFrom : null,
                                        customTo:   selectedType === 'Custom Date Range' ? customTo   : null,
                                    };
                                    setReportsData(prev => [newReport, ...prev]);
                                    generateReportPDF(newReport);
                                    setGenerating(false);
                                    setShowModal(false);
                                }}
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {generating ? 'Generating…' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
