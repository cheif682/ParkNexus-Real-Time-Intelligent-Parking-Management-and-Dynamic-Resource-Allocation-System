import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Reservation, ReservationStatus } from '../../types';
import { CalendarCheck, Search, XCircle, Clock, MapPin, Printer } from 'lucide-react';

export const ReservationHistoryPage: React.FC = () => {
  const { success, error } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchRef, setSearchRef] = useState<string>('');

  useEffect(() => {
    loadReservations();
  }, [statusFilter]);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const st = statusFilter === 'ALL' ? undefined : statusFilter;
      const data = await api.getReservations(st);
      setReservations(data || []);
    } catch (e: any) {
      error(e.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string, ref: string) => {
    if (!confirm(`Are you sure you want to cancel booking ${ref}?`)) return;

    try {
      await api.cancelReservation(id, 'Customer requested cancellation');
      success(`Booking ${ref} cancelled successfully.`);
      loadReservations();
    } catch (err: any) {
      error(err.message || 'Failed to cancel reservation');
    }
  };

  const filtered = reservations.filter((r) => {
    if (searchRef && !r.booking_reference.toLowerCase().includes(searchRef.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Reservations</h2>
        <p className="text-xs text-slate-500 mt-1">
          Review upcoming bookings, inspect allocated slots, and manage reservations
        </p>
      </div>

      {/* Filter Tabs and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Bookings' : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
            placeholder="Search reference..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Reservations List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading reservations...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          No reservations found matching this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => {
            const canCancel = r.status === 'CONFIRMED';
            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                {/* Left detail */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">{r.booking_reference}</span>
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
                  </div>

                  <p className="font-bold text-base text-slate-800">{r.facility_name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{r.facility_address || 'Bengaluru'}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                    <span>
                      Allocated Slot: <strong className="text-blue-600">{r.slot_number}</strong> ({r.zone_name})
                    </span>
                    <span>•</span>
                    <span>
                      Vehicle: <strong className="font-mono text-slate-800">{r.license_plate}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Time: {new Date(r.start_time).toLocaleString()} to {new Date(r.end_time).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Right detail & actions */}
                <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">Estimated Amount</span>
                    <span className="text-lg font-black text-slate-900">₹{r.estimated_amount}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(r.id, r.booking_reference)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
