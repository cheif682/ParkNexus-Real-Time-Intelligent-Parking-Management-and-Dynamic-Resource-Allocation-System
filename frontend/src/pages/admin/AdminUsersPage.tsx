import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { User, UserRole } from '../../types';
import { Users, Search, Shield, Briefcase, Car, Check, X, ShieldAlert } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const { success, error } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const role = roleFilter === 'ALL' ? undefined : roleFilter;
      const data = await api.getUsers(search || undefined, role);
      setUsers(data || []);
    } catch (e: any) {
      error(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await api.updateUserStatus(user.id, { is_active: !user.is_active });
      success(`User ${user.full_name} status updated.`);
      loadUsers();
    } catch (err: any) {
      error(err.message || 'Failed to update user status');
    }
  };

  const filtered = users.filter((u) => {
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h2>
          <p className="text-xs text-slate-500 mt-1">Review authenticated accounts, role permissions, and access status</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-semibold"
          >
            <option value="ALL">All Roles</option>
            <option value="CUSTOMER">Customers</option>
            <option value="PARKING_STAFF">Parking Staff</option>
            <option value="ADMIN">Administrators</option>
          </select>

          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user or email..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading user accounts...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">{u.full_name}</td>
                    <td className="py-3 px-3 font-medium text-slate-700">{u.email}</td>
                    <td className="py-3 px-3 text-slate-600">{u.phone_number || 'N/A'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'PARKING_STAFF'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role === 'ADMIN' && <Shield className="w-2.5 h-2.5" />}
                        {u.role === 'PARKING_STAFF' && <Briefcase className="w-2.5 h-2.5" />}
                        {u.role === 'CUSTOMER' && <Car className="w-2.5 h-2.5" />}
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          u.is_active
                            ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                            : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
