import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AnalyticsSummary } from '../../types';
import {
  Download,
  BarChart3,
  Calendar,
  CreditCard,
  FileSpreadsheet,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

export const AdminReportsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Data Analytics</h2>
          <p className="text-xs text-slate-500 mt-1">Export relational reports and review longitudinal operational trends</p>
        </div>
      </div>

      {/* CSV Export Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Reservations Master Report</h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete customer booking ledger including references, vehicle details, slots and status.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100">
            <a
              href={api.getExportCsvUrl('reservations')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" /> Download Reservations CSV
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Parking Sessions Report</h3>
            <p className="text-xs text-slate-500 mt-1">
              Physical bay check-in and check-out logs with duration in minutes and final settled fees.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100">
            <a
              href={api.getExportCsvUrl('sessions')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" /> Download Sessions CSV
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Financial Revenue Report</h3>
            <p className="text-xs text-slate-500 mt-1">
              Transaction references, payment methods (UPI, Card, Simulated) and audited revenue totals.
            </p>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100">
            <a
              href={api.getExportCsvUrl('payments')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" /> Download Payments CSV
            </a>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Booking Volume */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Revenue & Booking Trends</h3>
              <p className="text-xs text-slate-500">Historical performance data generated from backend database</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenue_trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="bookings" name="Bookings Count" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Facility Occupancy Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base text-slate-900">Facility Capacity Utilization (%)</h3>
              <p className="text-xs text-slate-500">Occupancy rate benchmark per commercial location</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.occupancy_by_facility} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="facility_name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '11px', border: 'none' }}
                  />
                  <Bar dataKey="occupancy_rate" name="Occupancy %" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
