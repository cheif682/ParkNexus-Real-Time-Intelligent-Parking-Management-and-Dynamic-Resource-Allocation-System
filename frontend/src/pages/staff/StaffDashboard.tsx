import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Facility, ParkingSession, Reservation, Complaint } from '../../types';
import {
  LogIn,
  LogOut,
  Clock,
  Car,
  Layers,
  AlertCircle,
  CheckCircle2,
  Building2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [activeSessions, setActiveSessions] = useState<ParkingSession[]>([]);
  const [expectedArrivals, setExpectedArrivals] = useState<Reservation[]>([]);
  const [openComplaints, setOpenComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaffOverview();
  }, [selectedFacilityId]);

  const loadStaffOverview = async () => {
    try {
      setLoading(true);
      const facList = await api.getFacilities();
      setFacilities(facList || []);

      const fid = selectedFacilityId || (facList.length > 0 ? facList[0].id : '');
      if (!selectedFacilityId && facList.length > 0) {
        setSelectedFacilityId(facList[0].id);
      }

      if (fid) {
        const [sessList, resList, compList] = await Promise.all([
          api.getActiveSessions(fid),
          api.getReservations('CONFIRMED'),
          api.getComplaints('OPEN'),
        ]);

        setActiveSessions(sessList || []);
        setExpectedArrivals(resList || []);
        setOpenComplaints(compList || []);
      }
    } catch (e) {
      console.error('Failed to load staff overview:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentFacility = facilities.find((f) => f.id === selectedFacilityId);

  return (
    <div className="space-y-6">
      {/* Header and Facility Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 mb-1">
            Gate Operations Console
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Parking Staff Portal</h2>
          <p className="text-xs text-slate-500">Live bay occupancy, vehicle entry/exit processing and gate control</p>
        </div>

        {/* Facility Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Assigned Facility:</label>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to={`/staff/check-in?facility_id=${selectedFacilityId}`}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl p-5 shadow-sm transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold">
              <LogIn className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Vehicle Entry Verification</h3>
              <p className="text-xs text-blue-100 mt-0.5">Scan license plate or booking ref to check-in</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
        </Link>

        <Link
          to={`/staff/check-out?facility_id=${selectedFacilityId}`}
          className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white rounded-2xl p-5 shadow-sm transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center font-bold">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Process Vehicle Exit</h3>
              <p className="text-xs text-slate-300 mt-0.5">Calculate final duration, settle fee & release slot</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
        </Link>
      </div>

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Available Bays</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            {currentFacility?.available_slots || 0}
          </span>
          <span className="text-[10px] text-slate-400">Out of {currentFacility?.total_capacity || 0} total</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Active Sessions</span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {activeSessions.length}
          </span>
          <span className="text-[10px] text-slate-400">Currently parked inside</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Expected Arrivals</span>
          <span className="text-2xl font-black text-blue-600 mt-1 block">
            {expectedArrivals.length}
          </span>
          <span className="text-[10px] text-slate-400">Confirmed upcoming bookings</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Open Issues</span>
          <span className="text-2xl font-black text-purple-600 mt-1 block">
            {openComplaints.length}
          </span>
          <span className="text-[10px] text-slate-400">Support tickets requiring review</span>
        </div>
      </div>

      {/* Active Sessions Live Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Vehicles Currently Parked Inside</h3>
            <p className="text-xs text-slate-500">Physical bay occupancy synchronized with backend relational state</p>
          </div>
          <Link to="/staff/active-sessions" className="text-xs text-blue-600 font-semibold hover:underline">
            View full live list →
          </Link>
        </div>

        {activeSessions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No active parked vehicles at this facility currently.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Vehicle Plate</th>
                  <th className="py-2.5 px-3">Make / Model</th>
                  <th className="py-2.5 px-3">Slot Bay</th>
                  <th className="py-2.5 px-3">Entry Time</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeSessions.slice(0, 5).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 text-sm">{s.license_plate}</td>
                    <td className="py-3 px-3 text-slate-700">{s.vehicle_make_model}</td>
                    <td className="py-3 px-3 font-black text-blue-600">{s.slot_number}</td>
                    <td className="py-3 px-3">{new Date(s.entry_time).toLocaleTimeString()}</td>
                    <td className="py-3 px-3">{s.user_name || 'Customer'}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => navigate(`/staff/check-out?session_id=${s.id}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition"
                      >
                        Process Exit
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
