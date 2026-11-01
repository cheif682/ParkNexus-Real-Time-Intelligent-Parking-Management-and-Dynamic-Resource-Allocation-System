import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Reservation, ReservationStatus, Facility } from '../../types';
import { CalendarCheck, Search, Filter } from 'lucide-react';

export const AdminReservationsPage: React.FC = () => {
  const { error } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchRef, setSearchRef] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, [statusFilter, selectedFacilityId]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const [resData, facData] = await Promise.all([
        api.getReservations(statusFilter === 'ALL' ? undefined : statusFilter, searchRef || undefined),
        api.getFacilities(),
      ]);
      setReservations(resData || []);
      setFacilities(facData || []);
    } catch (e: any) {
      error(e.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const filtered = reservations.filter((r) => {
    if (selectedFacilityId && r.facility_id !== selectedFacilityId) return false;
    if (searchRef && !r.booking_reference.toLowerCase().includes(searchRef.toLowerCase()) && !r.user_name?.toLowerCase().includes(searchRef.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Reservations</h2>
          <p className="text-xs text-slate-500 mt-1">Audit and monitor all platform booking records across facilities</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              placeholder="Search reference or customer..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading reservations...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No reservations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Time Range</th>
                  <th className="py-2.5 px-3">Fee</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{r.booking_reference}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">{r.user_name || 'Customer'}</span>
                      <span className="text-[10px] text-slate-400">{r.user_email}</span>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{r.facility_name}</td>
                    <td className="py-3 px-3 font-black text-blue-600">{r.slot_number}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{r.license_plate}</td>
                    <td className="py-3 px-3 text-[11px] text-slate-600">
                      {new Date(r.start_time).toLocaleDateString()} {new Date(r.start_time).toLocaleTimeString()} -{' '}
                      {new Date(r.end_time).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">₹{r.estimated_amount}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : r.status === 'ACTIVE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : r.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {r.status}
                      </span>
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
