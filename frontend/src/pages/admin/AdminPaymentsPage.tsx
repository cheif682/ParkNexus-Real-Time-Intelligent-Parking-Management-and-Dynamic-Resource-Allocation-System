import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Payment } from '../../types';
import { CreditCard, Search, Download, DollarSign } from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const { error } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await api.getPayments();
      setPayments(data || []);
    } catch (e: any) {
      error(e.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const totalVolume = payments.reduce((acc, p) => acc + (p.status === 'SUCCESSFUL' ? p.amount : 0), 0);
  const filtered = payments.filter((p) => {
    if (search && !p.transaction_reference.toLowerCase().includes(search.toLowerCase()) && !p.user_name?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Transactions</h2>
          <p className="text-xs text-slate-500 mt-1">Audit payment records, idempotency keys, and transaction settlements</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={api.getExportCsvUrl('payments')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" /> Export Payments CSV
          </a>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Settled Revenue</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">₹{totalVolume.toFixed(2)}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total Transactions</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{payments.length}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Average Ticket</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            ₹{payments.length > 0 ? (totalVolume / payments.length).toFixed(1) : '0'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900">Transaction Ledger</h3>
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference or customer..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading transactions...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No transactions recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Transaction Reference</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Booking Ref</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{p.transaction_reference}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">{p.user_name || 'Customer'}</span>
                      <span className="text-[10px] text-slate-400">{p.user_email}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{p.booking_reference || 'Exit Pay'}</td>
                    <td className="py-3 px-3 uppercase font-semibold text-[10px] text-slate-700">{p.payment_method}</td>
                    <td className="py-3 px-3 font-black text-slate-900 text-sm">₹{p.amount}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(p.created_at).toLocaleString()}
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
