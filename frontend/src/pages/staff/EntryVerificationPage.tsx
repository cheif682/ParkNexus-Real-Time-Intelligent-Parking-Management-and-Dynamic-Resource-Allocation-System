import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Facility, ParkingSession } from '../../types';
import { LogIn, Search, CheckCircle2, AlertCircle, Car, ShieldCheck } from 'lucide-react';

export const EntryVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(searchParams.get('facility_id') || '');

  const [bookingRef, setBookingRef] = useState<string>('');
  const [licensePlate, setLicensePlate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [lastCheckIn, setLastCheckIn] = useState<ParkingSession | null>(null);

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      const data = await api.getFacilities();
      setFacilities(data || []);
      if (!selectedFacilityId && data.length > 0) {
        setSelectedFacilityId(data[0].id);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleVerifyAndCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacilityId) {
      error('Please select the parking facility');
      return;
    }
    if (!bookingRef && !licensePlate) {
      error('Enter either a Booking Reference or License Plate Number');
      return;
    }

    try {
      setLoading(true);
      const session = await api.checkInVehicle({
        facility_id: selectedFacilityId,
        booking_reference: bookingRef.trim().toUpperCase() || undefined,
        license_plate: licensePlate.trim().toUpperCase() || undefined,
      });

      setLastCheckIn(session);
      success(`Vehicle ${session.license_plate} verified! Guide driver to Slot ${session.slot_number}.`);
      setBookingRef('');
      setLicensePlate('');
    } catch (err: any) {
      error(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gate Entry Verification</h2>
        <p className="text-xs text-slate-500 mt-1">
          Verify vehicle eligibility, validate active reservations, and trigger gate barrier opening
        </p>
      </div>

      {/* Verification Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <form onSubmit={handleVerifyAndCheckIn} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active Facility Gate *
            </label>
            <select
              value={selectedFacilityId}
              onChange={(e) => setSelectedFacilityId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} ({fac.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Booking Reference (e.g. PN-...)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={bookingRef}
                  onChange={(e) => setBookingRef(e.target.value.toUpperCase())}
                  placeholder="PN-20261101-ABCD"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                OR Vehicle License Plate
              </label>
              <div className="relative">
                <Car className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="KA-01-MJ-1024"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            Tip: Automatic number plate recognition (ANPR) simulation matches confirmed bookings for this vehicle.
          </p>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Verifying Credentials...' : 'Verify Entry & Open Barrier'}
            </button>
          </div>
        </form>
      </div>

      {/* Verification Success Highlight */}
      {lastCheckIn && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-6 shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Gate Entry Approved • Session Created
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Guide Vehicle to Slot: <span className="text-blue-600">{lastCheckIn.slot_number}</span>
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/80 p-4 rounded-xl border border-emerald-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">License Plate</span>
              <span className="font-mono font-bold text-slate-900">{lastCheckIn.license_plate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Vehicle Model</span>
              <span className="font-semibold text-slate-800">{lastCheckIn.vehicle_make_model}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Check-In Time</span>
              <span className="font-semibold text-slate-800">{new Date(lastCheckIn.entry_time).toLocaleTimeString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Session ID</span>
              <span className="font-mono text-slate-600 truncate block">#{lastCheckIn.id.substring(0, 8)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
