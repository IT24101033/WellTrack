import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, UserCheck, UserX, ShieldCheck, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { getAllUsers, updateUserStatus, updateUserRole, permanentDelete } from '../../services/userService';
import { useToast } from '../../components/ui/Toast';
import Spinner from '../../components/ui/Spinner';

const ROLES = ['', 'student', 'admin'];

export default function AdminUsers() {
    const { toast } = useToast();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ pages: 1, total: 0 });
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAllUsers({ search, role: roleFilter, page, limit: 8 });
            setUsers(res.data.data);
            setPagination(res.data.pagination);
        } catch {
            toast.error('Failed to fetch users.');
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, roleFilter, page]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Debounce search
    useEffect(() => { setPage(1); }, [search, roleFilter]);

    const handleStatusToggle = async (user) => {
        try {
            await updateUserStatus(user._id, !user.isActive);
            toast.success(`User ${user.isActive ? 'deactivated' : 'reactivated'}.`);
            fetchUsers();
        } catch {
            toast.error('Failed to update status.');
        }
    };

    const handleRoleChange = async (user, role) => {
        try {
            await updateUserRole(user._id, role);
            toast.success(`Role updated to ${role}.`);
            fetchUsers();
        } catch {
            toast.error('Failed to update role.');
        }
    };

    const handleDelete = async (user) => {
        if (!confirm(`Permanently delete ${user.fullName}? This cannot be undone.`)) return;
        try {
            await permanentDelete(user._id);
            toast.success('User permanently deleted.');
            fetchUsers();
        } catch {
            toast.error('Failed to delete user.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-500 mt-1">Manage all registered users — {pagination.total} total</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, email or university ID…"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]">
                    {ROLES.map(r => <option key={r} value={r}>{r ? r.charAt(0).toUpperCase() + r.slice(1) : 'All Roles'}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-16"><Spinner size="lg" /></div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No users found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {['User', 'University ID', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {users.map(u => {
                                    const initials = u.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                    return (
                                        <tr key={u._id} className="hover:bg-gray-50/50 transition">
                                            {/* User */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    {u.profileImage
                                                        ? <img src={`http://localhost:5000${u.profileImage}`} alt="" className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-100" />
                                                        : <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">{initials}</div>
                                                    }
                                                    <div>
                                                        <p className="font-medium text-gray-900">{u.fullName}</p>
                                                        <p className="text-xs text-gray-400">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Uni ID */}
                                            <td className="px-4 py-3.5 text-gray-600">{u.universityId || '—'}</td>
                                            {/* Role */}
                                            <td className="px-4 py-3.5">
                                                <select value={u.role}
                                                    onChange={e => handleRoleChange(u, e.target.value)}
                                                    className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium capitalize cursor-pointer">
                                                    <option value="student">Student</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            {/* Status */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    {u.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            {/* Joined */}
                                            <td className="px-4 py-3.5 text-gray-500 text-xs">
                                                {new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            {/* Actions */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => setSelectedUser(u)} title="View"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleStatusToggle(u)}
                                                        title={u.isActive ? 'Deactivate' : 'Reactivate'}
                                                        className={`p-1.5 rounded-lg transition ${u.isActive ? 'text-gray-400 hover:bg-orange-50 hover:text-orange-600' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}`}>
                                                        {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => handleDelete(u)} title="Delete"
                                                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Page {page} of {pagination.pages}</p>
                        <div className="flex gap-1">
                            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={() => setSelectedUser(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold">
                                {selectedUser.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{selectedUser.fullName}</p>
                                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            {[['Role', selectedUser.role], ['University ID', selectedUser.universityId || '—'],
                            ['Age', selectedUser.age || '—'], ['Gender', selectedUser.gender || '—'],
                            ['Height', selectedUser.height ? `${selectedUser.height} cm` : '—'],
                            ['Weight', selectedUser.weight ? `${selectedUser.weight} kg` : '—'],
                            ['Status', selectedUser.isActive ? 'Active' : 'Inactive'],
                            ['Joined', new Date(selectedUser.createdAt).toLocaleDateString()]
                            ].map(([label, val]) => (
                                <div key={label} className="flex justify-between py-1.5 border-b border-gray-50">
                                    <span className="text-gray-500 font-medium">{label}</span>
                                    <span className="text-gray-800 capitalize">{val}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setSelectedUser(null)}
                            className="mt-5 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition">
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
