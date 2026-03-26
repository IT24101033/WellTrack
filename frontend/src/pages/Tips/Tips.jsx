import React, { useState, useEffect, useCallback } from "react";
import {
    Brain,
    Dumbbell,
    Utensils,
    Pencil,
    Trash2,
    PlusCircle,
    Loader2,
    AlertCircle,
    RefreshCw,
    Sparkles,
    Play,
    Youtube,
    Zap,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map frontend contentType (uppercase) → backend category (lowercase) */
const toCategory = (ct) => ct?.toLowerCase() ?? "diet";

/** Map backend category (lowercase) → frontend contentType (uppercase) */
const toContentType = (cat) => cat?.toUpperCase() ?? "DIET";

/** Map backend tip object → frontend item shape */
const mapTip = (t) => ({
    id: t._id,
    contentType: toContentType(t.category),
    title: t.title,
    description: t.description,
    time: t.time || "",
    duration: t.duration || "",
    status: t.status,
});

const EMPTY_FORM = {
    id: null,
    contentType: "DIET",
    title: "",
    description: "",
    time: "",
    duration: "",
};

// ── AI Insights Section ───────────────────────────────────────────────────────

const ADVICE_CATEGORIES = [
    {
        key: "diet",
        label: "Diet & Nutrition",
        icon: "🥗",
        iconComponent: Utensils,
        color: "#10b981",
        bg: "rgba(16,185,129,0.08)",
        border: "rgba(16,185,129,0.2)",
    },
    {
        key: "workout",
        label: "Workout Plan",
        icon: "💪",
        iconComponent: Dumbbell,
        color: "#f97316",
        bg: "rgba(249,115,22,0.08)",
        border: "rgba(249,115,22,0.2)",
    },
    {
        key: "mental",
        label: "Mental Wellness",
        icon: "🧠",
        iconComponent: Brain,
        color: "#8b5cf6",
        bg: "rgba(139,92,246,0.08)",
        border: "rgba(139,92,246,0.2)",
    },
];

function AIHealthInsights({ onAddAiPlan }) {
    const [aiData, setAiData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchAdvice = async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await api.post("/ai/health-advice");
            setAiData(data.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to generate AI advice. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(59,130,246,0.06) 100%)",
                border: "1px solid rgba(139,92,246,0.18)",
                borderRadius: "20px",
                padding: "24px",
                marginBottom: "8px",
            }}
        >
            {/* Header Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                        width: "44px", height: "44px", borderRadius: "14px",
                        background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "0 4px 14px rgba(139,92,246,0.35)",
                    }}>
                        <Sparkles style={{ color: "white", width: "22px", height: "22px" }} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                            🤖 AI Health Insights
                        </h2>
                        <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted, #64748b)", marginTop: "2px" }}>
                            Powered by Google Gemini · Analyzes your real health data
                        </p>
                    </div>
                </div>
                <button
                    onClick={fetchAdvice}
                    disabled={loading}
                    style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "10px 18px", borderRadius: "12px",
                        background: loading ? "rgba(139,92,246,0.15)" : "linear-gradient(135deg,#8b5cf6,#6d28d9)",
                        color: loading ? "#8b5cf6" : "white",
                        border: "none", cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "13px", fontWeight: 600,
                        boxShadow: loading ? "none" : "0 4px 14px rgba(139,92,246,0.35)",
                        transition: "all 0.2s",
                    }}
                >
                    {loading ? (
                        <><Loader2 style={{ width: "15px", height: "15px", animation: "spin 1s linear infinite" }} /> Generating…</>
                    ) : (
                        <><Sparkles style={{ width: "15px", height: "15px" }} /> Get AI Advice</>
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "10px 14px", borderRadius: "10px", marginBottom: "16px",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444",
                    fontSize: "13px",
                }}>
                    <AlertCircle style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                    {error}
                </div>
            )}

            {/* Loading skeleton */}
            {loading && !aiData && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                    {ADVICE_CATEGORIES.map(cat => (
                        <div key={cat.key} style={{
                            background: cat.bg, border: `1px solid ${cat.border}`,
                            borderRadius: "14px", padding: "18px",
                        }}>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: `${cat.color}22`, animation: "pulse 1.5s ease infinite" }} />
                                <div style={{ height: "14px", width: "100px", background: `${cat.color}22`, borderRadius: "6px", animation: "pulse 1.5s ease infinite" }} />
                            </div>
                            <div style={{ height: "12px", width: "90%", background: `${cat.color}15`, borderRadius: "6px", marginBottom: "6px", animation: "pulse 1.5s ease infinite" }} />
                            <div style={{ height: "12px", width: "75%", background: `${cat.color}15`, borderRadius: "6px", animation: "pulse 1.5s ease infinite" }} />
                        </div>
                    ))}
                </div>
            )}

            {/* Advice Cards */}
            {aiData && !loading && (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "24px" }}>
                        {ADVICE_CATEGORIES.map(cat => (
                            <div key={cat.key} style={{
                                background: cat.bg,
                                border: `1px solid ${cat.border}`,
                                borderRadius: "14px", padding: "18px",
                                transition: "transform 0.2s",
                            }}
                                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                                    <div style={{
                                        width: "32px", height: "32px", borderRadius: "9px",
                                        background: `${cat.color}22`, display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "16px",
                                    }}>
                                        {cat.icon}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <Zap style={{ width: "11px", height: "11px", color: cat.color }} />
                                        <span style={{ fontSize: "12px", fontWeight: 700, color: cat.color }}>{cat.label}</span>
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.6", color: "var(--text-secondary, #374151)" }}>
                                    {aiData.advice?.[cat.key] || "No advice available."}
                                </p>
                                
                                {/* Render generated plans if available */}
                                {aiData.advice?.[`${cat.key}_plans`] && aiData.advice[`${cat.key}_plans`].length > 0 && (
                                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {aiData.advice[`${cat.key}_plans`].map((plan, idx) => (
                                            <div key={idx} style={{ 
                                                padding: '10px', background: 'rgba(255,255,255,0.6)', 
                                                borderRadius: '10px', border: `1px solid ${cat.border}`,
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                                                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary, #1e293b)' }}>{plan.title}</h4>
                                                    <span style={{ fontSize: '10px', background: cat.color, color: 'white', padding: '3px 6px', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                        {plan.recommended_time || (cat.key === 'diet' ? 'Meal' : 'Activity')}
                                                    </span>
                                                </div>
                                                <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: 'var(--text-muted, #64748b)', lineHeight: '1.4' }}>{plan.description}</p>
                                                <button 
                                                    onClick={() => onAddAiPlan && onAddAiPlan(plan, cat.key)}
                                                    style={{ 
                                                        width: '100%', fontSize: '12px', background: 'white', 
                                                        color: cat.color, border: `1px solid ${cat.color}40`, 
                                                        padding: '6px 0', borderRadius: '8px', cursor: 'pointer', 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                                        gap: '6px', fontWeight: 600, transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = cat.color; e.currentTarget.style.color = 'white'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = cat.color; }}
                                                >
                                                    <CalendarPlus size={14} /> Add to Schedule
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* YouTube Videos */}
                    {aiData.videos && aiData.videos.length > 0 && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                                <Youtube style={{ width: "18px", height: "18px", color: "#ef4444" }} />
                                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                                    ▶ Recommended YouTube Videos based on your data
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
                                {aiData.videos.map((video, idx) => (
                                    <a
                                        key={idx}
                                        href={video.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ textDecoration: "none", flexShrink: 0, width: "180px" }}
                                    >
                                        <div style={{
                                            borderRadius: "12px", overflow: "hidden",
                                            border: "1px solid rgba(0,0,0,0.08)",
                                            background: "#fff",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                            transition: "transform 0.2s, box-shadow 0.2s",
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)"; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
                                        >
                                            {/* Thumbnail */}
                                            <div style={{ position: "relative", width: "180px", height: "101px", background: "#f1f5f9" }}>
                                                {video.thumbnail ? (
                                                    <img src={video.thumbnail} alt={video.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#e2e8f0" }}>
                                                        <Youtube style={{ width: "32px", height: "32px", color: "#ef4444" }} />
                                                    </div>
                                                )}
                                                {/* Play button overlay */}
                                                <div style={{
                                                    position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                                                    background: "rgba(0,0,0,0.15)",
                                                }}>
                                                    <div style={{
                                                        width: "36px", height: "36px", borderRadius: "50%",
                                                        background: "rgba(239,68,68,0.92)", display: "flex", alignItems: "center", justifyContent: "center",
                                                        boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
                                                    }}>
                                                        <Play style={{ width: "14px", height: "14px", color: "white", marginLeft: "2px" }} />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Info */}
                                            <div style={{ padding: "10px" }}>
                                                <p style={{
                                                    margin: 0, fontSize: "11px", fontWeight: 600, lineHeight: "1.4",
                                                    color: "#1e293b",
                                                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                                                }}>
                                                    {video.title}
                                                </p>
                                                <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#94a3b8" }}>
                                                    {video.channelTitle}
                                                </p>
                                            </div>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No YouTube key fallback */}
                    {aiData.videos && aiData.videos.length === 0 && (
                        <div style={{
                            padding: "14px", borderRadius: "12px",
                            background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.06)",
                            textAlign: "center", fontSize: "12px", color: "#94a3b8",
                        }}>
                            <Youtube style={{ width: "20px", height: "20px", margin: "0 auto 6px", color: "#ef4444" }} />
                            <p style={{ margin: 0 }}>Add a YouTube API key in the .env to see video recommendations.</p>
                            <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer"
                                style={{ color: "#3b82f6", fontSize: "11px" }}>
                                Get a free key at console.cloud.google.com
                            </a>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Tips() {
    const { isAdmin } = useAuth();

    const [activeCategory, setActiveCategory] = useState("ALL");
    const [wellnessItems, setWellnessItems] = useState([]);
    const [formState, setFormState] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // ── Fetch tips from backend ─────────────────────────────────────────────────
    const fetchTips = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            // Admin fetches all tips (approved + pending); students fetch approved only
            const endpoint = isAdmin ? "/wellness/admin" : "/wellness";
            const params = {};
            if (activeCategory !== "ALL") {
                params.category = toCategory(activeCategory);
            }
            const { data } = await api.get(endpoint, { params });
            setWellnessItems((data.data || []).map(mapTip));
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to load tips. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, [isAdmin, activeCategory]);

    useEffect(() => {
        fetchTips();
    }, [fetchTips]);

    // ── Auto-clear success message ──────────────────────────────────────────────
    useEffect(() => {
        if (!successMsg) return;
        const t = setTimeout(() => setSuccessMsg(""), 3000);
        return () => clearTimeout(t);
    }, [successMsg]);

    // ── CRUD handlers ───────────────────────────────────────────────────────────

    const handleAddAiPlanToSchedule = async (plan, categoryStr) => {
        try {
            const payload = {
                title: plan.title,
                description: plan.description,
                category: categoryStr.toUpperCase(),
                time: plan.recommended_time || "",
                duration: plan.duration || "",
                status: "approved",
                target_type: plan.target_type || "GENERAL",
                difficulty_level: plan.difficulty_level || "EASY"
            };
            await api.post("/wellness", payload);
            fetchTips();
            setSuccessMsg(`Added "${plan.title}" to schedule!`);
        } catch (err) {
            console.error("Failed to schedule plan", err);
            setError("Failed to add plan to schedule.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formState.title.trim() || !formState.description.trim()) return;

        setSubmitting(true);
        setError("");
        try {
            const payload = {
                title: formState.title.trim(),
                description: formState.description.trim(),
                category: toCategory(formState.contentType),
                time: formState.time || "",
                duration: formState.duration.trim() || "",
                status: "approved", // admin creates directly as approved
            };

            if (formState.id === null) {
                // CREATE
                const { data } = await api.post("/wellness", payload);
                setWellnessItems((prev) => [mapTip(data.data), ...prev]);
                setSuccessMsg("Tip added successfully!");
            } else {
                // UPDATE
                const { data } = await api.put(`/wellness/${formState.id}`, payload);
                setWellnessItems((prev) =>
                    prev.map((item) =>
                        item.id === formState.id ? mapTip(data.data) : item
                    )
                );
                setSuccessMsg("Tip updated successfully!");
            }

            setFormState(EMPTY_FORM);
        } catch (err) {
            setError(err.response?.data?.message || "Operation failed.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (item) => {
        setFormState(item);
        document
            .getElementById("wellness-form")
            ?.scrollIntoView({ behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this tip?")) return;
        try {
            await api.delete(`/wellness/${id}`);
            setWellnessItems((prev) => prev.filter((item) => item.id !== id));
            setSuccessMsg("Tip deleted.");
        } catch (err) {
            setError(err.response?.data?.message || "Delete failed.");
        }
    };

    // ── Derived data ────────────────────────────────────────────────────────────

    const filteredItems =
        activeCategory === "ALL"
            ? wellnessItems
            : wellnessItems.filter((item) => item.contentType === activeCategory);

    const timelineItems = wellnessItems
        .filter((item) => item.time)
        .sort((a, b) => a.time.localeCompare(b.time));

    // ── Render ──────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-8">

            {/* HEADER */}
            <div className="text-center">
                <h2 className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
                    Health Tips &amp; Advice
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                    Personalised wellness content for students
                </p>
            </div>

            {/* Toast messages */}
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {error}
                </div>
            )}
            {successMsg && (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                    ✅ {successMsg}
                </div>
            )}

            {/* AI HEALTH INSIGHTS */}
            <AIHealthInsights onAddAiPlan={handleAddAiPlanToSchedule} />

            {/* CATEGORY CARDS */}
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { id: "DIET", title: "Diet Plan", icon: Utensils, color: "#10b981" },
                    { id: "WORKOUT", title: "Workout", icon: Dumbbell, color: "#f97316" },
                    { id: "MENTAL", title: "Mental Wellness", icon: Brain, color: "#8b5cf6" },
                ].map((cat) => {
                    const active = activeCategory === cat.id;
                    return (
                        <div
                            key={cat.id}
                            onClick={() =>
                                setActiveCategory(active ? "ALL" : cat.id)
                            }
                            className="cursor-pointer rounded-xl p-6 shadow-sm border transition-all duration-200"
                            style={{
                                background: active
                                    ? `${cat.color}15`
                                    : "var(--glass-bg, #f9fafb)",
                                borderColor: active ? cat.color : "var(--glass-border, #e5e7eb)",
                            }}
                        >
                            <cat.icon
                                className="h-6 w-6 mb-3"
                                style={{ color: cat.color }}
                            />
                            <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                {cat.title}
                            </h3>
                            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                                {wellnessItems.filter((i) => i.contentType === cat.id).length} tips
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* TIPS LIST + TIMELINE */}
            <div className="grid lg:grid-cols-2 gap-8">

                {/* LEFT — Tip Cards */}
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-4 border-b pb-3 text-sm flex-wrap">
                            {["ALL", "DIET", "WORKOUT", "MENTAL"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveCategory(tab)}
                                    className="transition-colors duration-150"
                                    style={{
                                        color:
                                            activeCategory === tab
                                                ? "var(--accent-blue, #3b82f6)"
                                                : "var(--text-muted, #6b7280)",
                                        fontWeight: activeCategory === tab ? 700 : 400,
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={fetchTips}
                            title="Refresh"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"
                        >
                            <RefreshCw size={15} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-gray-400">
                            <Loader2 size={24} className="animate-spin mr-2" />
                            Loading tips…
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <p className="text-sm text-gray-400 py-8 text-center">
                            No tips found for this category.
                        </p>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="border rounded-lg p-4 bg-gray-50 hover:shadow-md transition-shadow duration-200"
                                >
                                    {/* Status badge (admin only) */}
                                    {isAdmin && item.status !== "approved" && (
                                        <span className="inline-block text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mb-2">
                                            {item.status}
                                        </span>
                                    )}

                                    <span className="text-xs font-semibold uppercase tracking-wide"
                                        style={{
                                            color:
                                                item.contentType === "DIET"
                                                    ? "#10b981"
                                                    : item.contentType === "WORKOUT"
                                                        ? "#f97316"
                                                        : "#8b5cf6",
                                        }}
                                    >
                                        {item.contentType}
                                    </span>

                                    <h4 className="font-semibold text-sm mt-1" style={{ color: "var(--text-primary)" }}>
                                        {item.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-2 line-clamp-3">
                                        {item.description}
                                    </p>

                                    {item.time && (
                                        <p className="text-xs mt-2 text-gray-400">
                                            🕐 {item.time}
                                            {item.duration ? ` • ${item.duration}` : ""}
                                        </p>
                                    )}

                                    {isAdmin && (
                                        <div className="flex justify-end gap-3 mt-4 text-xs">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                <Pencil size={14} /> Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT — Timeline */}
                <div className="bg-white rounded-xl p-6 shadow-sm border">
                    <h3 className="font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
                        🗓 Daily Habit Timeline
                    </h3>

                    <div className="space-y-6 border-l-2 border-blue-100 pl-6">
                        {timelineItems.length === 0 ? (
                            <p className="text-sm text-gray-400">
                                No scheduled tips yet. Add a tip with a time to see it here.
                            </p>
                        ) : (
                            timelineItems.map((item) => (
                                <div key={item.id} className="relative">
                                    {/* Dot */}
                                    <span className="absolute -left-[1.65rem] top-1 w-2.5 h-2.5 rounded-full bg-blue-400 border-2 border-white" />
                                    <span className="text-xs text-gray-400 font-mono">{item.time}</span>
                                    <h4 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full"
                                            style={{
                                                background:
                                                    item.contentType === "DIET"
                                                        ? "#d1fae5"
                                                        : item.contentType === "WORKOUT"
                                                            ? "#ffedd5"
                                                            : "#ede9fe",
                                                color:
                                                    item.contentType === "DIET"
                                                        ? "#065f46"
                                                        : item.contentType === "WORKOUT"
                                                            ? "#9a3412"
                                                            : "#5b21b6",
                                            }}
                                        >
                                            {item.contentType}
                                        </span>
                                        {item.duration && (
                                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                                                {item.duration}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ADMIN FORM */}
            {isAdmin && (
                <div
                    id="wellness-form"
                    className="bg-white rounded-xl p-6 shadow-sm border"
                >
                    <h4 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                        {formState.id === null ? "➕ Create" : "✏️ Update"} Wellness Content
                    </h4>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Category */}
                        <select
                            className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={formState.contentType}
                            onChange={(e) =>
                                setFormState({ ...formState, contentType: e.target.value })
                            }
                        >
                            <option value="DIET">🥗 Diet Plan</option>
                            <option value="WORKOUT">🏋️ Workout</option>
                            <option value="MENTAL">🧘 Mental Wellness</option>
                        </select>

                        {/* Title */}
                        <input
                            type="text"
                            placeholder="Title *"
                            required
                            className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={formState.title}
                            onChange={(e) =>
                                setFormState({ ...formState, title: e.target.value })
                            }
                        />

                        {/* Description */}
                        <textarea
                            rows="3"
                            placeholder="Description *"
                            required
                            className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            value={formState.description}
                            onChange={(e) =>
                                setFormState({ ...formState, description: e.target.value })
                            }
                        />

                        <div className="grid grid-cols-2 gap-4">
                            {/* Time */}
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                    Time (optional — for timeline)
                                </label>
                                <input
                                    type="time"
                                    className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    value={formState.time}
                                    onChange={(e) =>
                                        setFormState({ ...formState, time: e.target.value })
                                    }
                                />
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                    Duration (optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 30 mins"
                                    className="w-full border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    value={formState.duration}
                                    onChange={(e) =>
                                        setFormState({ ...formState, duration: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm text-white disabled:opacity-60 transition-opacity"
                                style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}
                            >
                                {submitting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <PlusCircle size={16} />
                                )}
                                {formState.id === null ? "Add Tip" : "Update Tip"}
                            </button>

                            {formState.id !== null && (
                                <button
                                    type="button"
                                    onClick={() => setFormState(EMPTY_FORM)}
                                    className="px-4 py-2 rounded-md text-sm border text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
