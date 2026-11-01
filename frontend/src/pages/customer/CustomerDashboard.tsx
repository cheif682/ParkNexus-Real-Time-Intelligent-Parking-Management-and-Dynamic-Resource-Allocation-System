import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Reservation, ParkingSession, Vehicle, Facility } from '../../types';
import {
  Car,
  Compass,
  CalendarCheck,
  Clock,
  CreditCard,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  const [activeSession, setActiveSession] = useState<ParkingSession | null>(null);
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [vList, rList, sList, fList] = await Promise.all([
        api.getVehicles(),
        api.getReservations(),
        api.getSessions(),
        api.getFacilities(),
      ]);

      setVehicles(vList || []);
      setFacilities(fList.slice(0, 3) || []);

      // Active reservation (CONFIRMED or ACTIVE)
      const activeRes = (rList || []).find((r) => r.status === 'CONFIRMED' || r.status === 'ACTIVE');
      setActiveReservation(activeRes || null);
      setRecentReservations((rList || []).slice(0, 5));

      // Active parking session
      const currentSess = (sList || []).find((s) => s.status === 'ACTIVE');
      setActiveSession(currentSess || null);
    } catch (e) {
      console.error('Error loading customer dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-500/30">
            Welcome back
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {user?.full_name}
          </h2>
          <p className="mt-1 text-slate-300 text-sm max-w-xl">
            Real-time parking status, active bookings and dynamic slot allocations at your fingertips.
          </p>
        </div>

        <Link
          to="/customer/find-parking"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-md shadow-blue-500/25 flex-shrink-0"
        >
          <Compass className="w-4 h-4" />
          Find & Reserve Parking
        </Link>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Vehicles</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{vehicles.length}</p>
          <Link to="/customer/vehicles" className="mt-1 text-xs text-blue-600 hover:underline inline-block font-medium">
            Manage vehicles →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Reservation</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {activeReservation ? '1 Active' : 'None'}
          </p>
          <span className="mt-1 text-xs text-slate-500 block truncate">
            {activeReservation ? `${activeReservation.slot_number} @ ${activeReservation.facility_name}` : 'No upcoming bookings'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Session</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {activeSession ? 'Parked Now' : 'Idle'}
          </p>
          <span className="mt-1 text-xs text-slate-500 block truncate">
            {activeSession ? `Slot ${activeSession.slot_number} (${activeSession.license_plate})` : 'Vehicle not checked in'}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Facilities</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">{facilities.length}</p>
          <span className="mt-1 text-xs text-slate-500 block">Across Bengaluru Metro</span>
        </div>
      </div>

      {/* Active Session / Urgent Alert if Parked */}
      {activeSession && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 animate-pulse">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Active Parking Session in Progress
              </h4>
              <p className="text-xs text-slate-600">
                Your vehicle <span className="font-semibold text-slate-800">{activeSession.license_plate}</span> is currently parked in Slot <span className="font-semibold text-slate-800">{activeSession.slot_number}</span> at {activeSession.facility_name}.
              </p>
            </div>
          </div>
          <Link
            to="/customer/sessions"
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition"
          >
            View Live Session Details
          </Link>
        </div>
      )}

      {/* Quick Facility Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Live Facility Occupancy</h3>
            <p className="text-xs text-slate-500">Real-time slot availability from IoT & operational sensors</p>
          </div>
          <Link to="/customer/find-parking" className="text-xs text-blue-600 font-semibold hover:underline">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {facilities.map((fac) => {
            const occ = fac.occupancy_percentage || 0;
            return (
              <div
                key={fac.id}
                onClick={() => navigate(`/customer/facility/${fac.id}`)}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {fac.code}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      {fac.available_slots} Slots Free
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{fac.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{fac.address}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Capacity: {fac.total_capacity}</span>
                    <span className="font-medium">{occ}% Occupied</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${occ > 80 ? 'bg-rose-500' : occ > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${occ}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">Recent Booking Activity</h3>
          <Link to="/customer/reservations" className="text-xs text-blue-600 font-semibold hover:underline">
            View history →
          </Link>
        </div>

        {recentReservations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No recent reservations found. Click "Find & Reserve Parking" above to book your first slot.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Estimated Fee</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentReservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-900">{r.booking_reference}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{r.facility_name}</td>
                    <td className="py-3 px-3 font-semibold text-blue-600">{r.slot_number}</td>
                    <td className="py-3 px-3">{r.license_plate}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">₹{r.estimated_amount}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === 'CONFIRMED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : r.status === 'ACTIVE'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : r.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
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
