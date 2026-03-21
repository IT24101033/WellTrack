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
        // Scroll to form
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
        <div className="space-y-10">

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
