import React, { useState, useEffect } from 'react';
import tipService from '../../services/tipService';
import { Pencil, Trash2, PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminTipsManagement() {
    const [tips, setTips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        title: '',
        description: '',
        category: 'DIET',
        difficulty_level: 'EASY',
        recommended_time: '',
        target_type: 'GENERAL',
        is_active: true
    });

    useEffect(() => {
        fetchTips();
    }, []);

    const fetchTips = async () => {
        setLoading(true);
        setError('');
        try {
            // In a real app we'd fetch all (including inactive) for admin, 
            // but the backend getAllTips only fetches active currently, 
            // let's assume it fetches all or make a separate admin endpoint if needed.
            // Modifying controller to fetch all for admin might be necessary.
            // For now, we use what we have in tipService.getAllTips.
            const res = await tipService.getAllTips();
            setTips(res.data);
        } catch (err) {
            setError('Failed to fetch tips.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (tip = null) => {
        if (tip) {
            setIsEdit(true);
            setFormData({
                id: tip._id,
                title: tip.title,
                description: tip.description,
                category: tip.category,
                difficulty_level: tip.difficulty_level,
                recommended_time: tip.recommended_time || '',
                target_type: tip.target_type,
                is_active: tip.is_active
            });
        } else {
            setIsEdit(false);
            setFormData({
                id: null,
                title: '',
                description: '',
                category: 'DIET',
                difficulty_level: 'EASY',
                recommended_time: '',
                target_type: 'GENERAL',
                is_active: true
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            if (isEdit) {
                await tipService.updateTip(formData.id, formData);
                setSuccess('Tip updated successfully');
            } else {
                await tipService.createTip(formData);
                setSuccess('Tip created successfully');
            }
            handleCloseModal();
            fetchTips();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to save tip');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to deactivate this tip?')) return;
        try {
            await tipService.deleteTip(id);
            setSuccess('Tip deactivated successfully');
            fetchTips();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError('Failed to delete tip');
        }
    };

    const filteredTips = tips.filter(tip => {
        const matchCategory = filterCategory === 'ALL' || tip.category === filterCategory;
        const matchSearch = tip.title.toLowerCase().includes(search.toLowerCase()) ||
            tip.description.toLowerCase().includes(search.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Admin Tips Management</h1>
                    <p className="text-sm text-gray-500">Manage all food & lifestyle tips</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"
                >
                    <PlusCircle size={18} /> Add New Tip
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                    <AlertCircle size={18} /> {error}
                </div>
            )}
            {success && (
                <div className="p-3 mb-4 rounded-lg bg-green-50 text-green-700 border border-green-200">
                    ✅ {success}
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <input
                    type="text"
                    placeholder="Search by keyword..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="ALL">All Categories</option>
                    <option value="DIET">Diet</option>
                    <option value="WORKOUT">Workout</option>
                    <option value="MENTAL">Mental</option>
                </select>
                <button onClick={fetchTips} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-600">
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 font-semibold text-gray-600 text-sm">Title</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Category</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Target Type</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Difficulty</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Time</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm text-center">Status</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-400">Loading tips...</td></tr>
                        ) : filteredTips.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-400">No tips found.</td></tr>
                        ) : (
                            filteredTips.map((tip) => (
                                <tr key={tip._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-sm text-gray-800 font-medium">{tip.title}</td>
                                    <td className="p-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${tip.category === 'DIET' ? 'bg-green-100 text-green-700' :
                                            tip.category === 'WORKOUT' ? 'bg-orange-100 text-orange-700' :
                                                'bg-purple-100 text-purple-700'
                                            }`}>
                                            {tip.category}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">{tip.target_type}</td>
                                    <td className="p-4 text-sm text-gray-600">{tip.difficulty_level}</td>
                                    <td className="p-4 text-sm text-gray-600">{tip.recommended_time || '-'}</td>
                                    <td className="p-4 text-center">
                                        {tip.is_active ?
                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Active</span> :
                                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">Inactive</span>
                                        }
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(tip)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                            <Pencil size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(tip._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Tip' : 'Add New Tip'}</h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text" name="title" required
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.title} onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description" required rows="3"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.description} onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        name="category"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.category} onChange={handleChange}
                                    >
                                        <option value="DIET">DIET</option>
                                        <option value="WORKOUT">WORKOUT</option>
                                        <option value="MENTAL">MENTAL</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Type</label>
                                    <select
                                        name="target_type"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.target_type} onChange={handleChange}
                                    >
                                        <option value="GENERAL">GENERAL</option>
                                        <option value="STRESS">STRESS</option>
                                        <option value="SLEEP">SLEEP</option>
                                        <option value="FITNESS">FITNESS</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                    <select
                                        name="difficulty_level"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.difficulty_level} onChange={handleChange}
                                    >
                                        <option value="EASY">EASY</option>
                                        <option value="MEDIUM">MEDIUM</option>
                                        <option value="HARD">HARD</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Recommended Time</label>
                                    <input
                                        type="time" name="recommended_time"
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.recommended_time} onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {isEdit && (
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox" id="is_active" name="is_active"
                                        checked={formData.is_active} onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="is_active" className="text-sm text-gray-700">Active Tip</label>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 font-medium">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm">
                                    {isEdit ? 'Save Changes' : 'Create Tip'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
