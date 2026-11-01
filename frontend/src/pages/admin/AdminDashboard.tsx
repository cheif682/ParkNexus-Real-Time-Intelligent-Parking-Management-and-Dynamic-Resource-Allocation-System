import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AnalyticsSummary } from '../../types';
import {
  Building2,
  Layers,
  Car,
  Clock,
  CalendarCheck,
  CreditCard,
  AlertCircle,
  TrendingUp,
  Download,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      setData(res);
    } catch (e) {
      console.error('Failed to load admin analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  if (loading && !data) {
    return <div className="py-20 text-center text-sm text-slate-400">Loading executive analytics...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 mb-1">
            Enterprise Management Console
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Operations Dashboard</h2>
          <p className="text-xs text-slate-500">Live operational telemetry across all facilities derived from PostgreSQL database records</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={api.getExportCsvUrl('reservations')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" /> Export Reservations CSV
          </a>
        </div>
      </div>

      {/* 8 Primary Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Facilities</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{data.total_facilities}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Slots</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{data.total_slots}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Available</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">{data.available_slots}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Occupied</span>
          <span className="text-xl font-black text-rose-600 mt-1 block">{data.occupied_slots}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Reserved</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{data.reserved_slots}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Parked Now</span>
          <span className="text-xl font-black text-blue-600 mt-1 block">{data.active_sessions_count}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Today Bookings</span>
          <span className="text-xl font-black text-indigo-600 mt-1 block">{data.today_reservations_count}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Today Revenue</span>
          <span className="text-xl font-black text-emerald-700 mt-1 block">₹{data.today_revenue}</span>
        </div>
      </div>

      {/* Row 1 Charts: Occupancy by Facility & Revenue Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy by Facility */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Real-Time Occupancy by Facility</h3>
            <p className="text-[11px] text-slate-500">Live breakdown of occupied and reserved bays</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.occupancy_by_facility} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="facility_name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="occupied_slots" name="Occupied Bays" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reserved_slots" name="Reserved Bays" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="available_slots" name="Available Bays" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Revenue Trend Area Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">7-Day Revenue & Booking Volume</h3>
            <p className="text-[11px] text-slate-500">Aggregated daily transaction settlement in INR (₹)</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none' }}
                />
                <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Vehicle Distribution & Zone Occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Category Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Registered Vehicle Categories</h3>
            <p className="text-[11px] text-slate-500">Fleet distribution across customer profiles</p>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.vehicle_distribution}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.vehicle_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zone Occupancy List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 lg:col-span-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Zone-Level Utilization Breakdown</h3>
            <p className="text-[11px] text-slate-500">Operational load distribution across floor levels</p>
          </div>

          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {data.occupancy_by_zone.map((z) => (
              <div key={z.zone_id} className="p-3 rounded-lg bg-slate-50 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">{z.zone_name} ({z.facility_name})</span>
                  <span className="font-semibold text-slate-700">{z.occupied_slots} / {z.total_slots} bays ({z.occupancy_rate}%)</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${z.occupancy_rate > 75 ? 'bg-rose-500' : 'bg-blue-600'}`}
                    style={{ width: `${z.occupancy_rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions & Audit Logs Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Recent Financial Transactions</h3>
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase border-b border-slate-100">
                <tr>
                  <th className="py-2 px-3">Reference</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Amount</th>
                  <th className="py-2 px-3">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recent_transactions.slice(0, 5).map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 px-3 font-mono font-bold text-slate-900">{p.transaction_reference}</td>
                    <td className="py-2 px-3 text-slate-700">{p.user_name || 'Customer'}</td>
                    <td className="py-2 px-3 font-black text-slate-900">₹{p.amount}</td>
                    <td className="py-2 px-3 uppercase text-[10px] font-semibold">{p.payment_method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Recent Audit Events</h3>
          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {data.recent_activity.slice(0, 6).map((log) => (
              <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 uppercase text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">
                    {log.action}
                  </span>
                  <p className="text-slate-600 mt-1 line-clamp-1">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-2">
                  {log.created_at}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
