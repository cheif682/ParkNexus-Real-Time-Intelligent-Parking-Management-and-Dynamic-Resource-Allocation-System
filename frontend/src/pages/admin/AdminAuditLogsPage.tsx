import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { AuditLogItem } from '../../types';
import { History, Search, ShieldCheck } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const { error } = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(100);
      setLogs(data || []);
    } catch (e: any) {
      error(e.message || 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((l) => {
    if (search && !l.action.toLowerCase().includes(search.toLowerCase()) && !l.details?.toLowerCase().includes(search.toLowerCase()) && !l.user_name?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-1">Immutable security ledger tracking entry/exit verifications, maintenance and price changes</p>
        </div>

        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, user or details..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No audit events match your search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Actor / User</th>
                  <th className="py-2.5 px-3">Entity Type</th>
                  <th className="py-2.5 px-3">Entity Reference</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">{l.created_at}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">{l.user_name || 'System'}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px] text-slate-600">{l.entity_type}</td>
                    <td className="py-2.5 px-3 text-slate-700 truncate max-w-[120px]">{l.entity_id}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">{l.details}</td>
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
