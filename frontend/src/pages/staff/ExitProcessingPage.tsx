import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ParkingSession, Facility } from '../../types';
import { LogOut, Search, Clock, CreditCard, CheckCircle2, Car, Printer } from 'lucide-react';

export const ExitProcessingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(searchParams.get('facility_id') || '');
  const [activeSessions, setActiveSessions] = useState<ParkingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ParkingSession | null>(null);

  const [searchPlate, setSearchPlate] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('SIMULATED');
  const [processing, setProcessing] = useState<boolean>(false);
  const [completedExit, setCompletedExit] = useState<ParkingSession | null>(null);

  useEffect(() => {
    loadFacilitiesAndSessions();
  }, [selectedFacilityId]);

  const loadFacilitiesAndSessions = async () => {
    try {
      const facList = await api.getFacilities();
      setFacilities(facList || []);
      const fid = selectedFacilityId || (facList.length > 0 ? facList[0].id : '');
      if (!selectedFacilityId && facList.length > 0) {
        setSelectedFacilityId(facList[0].id);
      }

      if (fid) {
        const sessList = await api.getActiveSessions(fid);
        setActiveSessions(sessList || []);

        const targetId = searchParams.get('session_id');
        if (targetId) {
          const match = sessList.find((s) => s.id === targetId);
          if (match) setSelectedSession(match);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProcessExit = async () => {
    if (!selectedSession) return;

    try {
      setProcessing(true);
      const res = await api.checkOutVehicle({
        session_id: selectedSession.id,
        payment_method: paymentMethod,
      });

      setCompletedExit(res);
      success(`Vehicle ${res.license_plate} exited! Slot ${res.slot_number} is now released & available.`);
      setSelectedSession(null);
      loadFacilitiesAndSessions();
    } catch (err: any) {
      error(err.message || 'Exit processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const filteredSessions = activeSessions.filter((s) => {
    if (searchPlate && !s.license_plate?.toLowerCase().includes(searchPlate.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Vehicle Exit Processing</h2>
        <p className="text-xs text-slate-500 mt-1">
          Calculate parking session duration, process payment settlement, and release slot back to AVAILABLE
        </p>
      </div>

      {/* Facility and Plate Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-1/2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Gate Facility</label>
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-semibold"
          >
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.code})
              </option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-1/2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Search Plate</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
              placeholder="e.g. KA-01-..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Active Sessions Grid for Exit Selection */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Select Vehicle Approaching Exit Barrier ({filteredSessions.length} parked)
        </h3>

        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
            No active parked vehicles found at this facility.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSessions.map((s) => {
              const isSelected = selectedSession?.id === s.id;
              const entryDate = new Date(s.entry_time);
              const elapsedMins = Math.max(1, Math.round((Date.now() - entryDate.getTime()) / 60000));

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSession(s)}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {s.slot_number}
                    </div>
                    <div>
                      <p className="font-mono font-black text-slate-900 text-sm">{s.license_plate}</p>
                      <p className="text-[11px] text-slate-500">{s.vehicle_make_model}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Entry: {entryDate.toLocaleTimeString()} (~{elapsedMins} mins ago)
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-blue-600">Select →</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Session Checkout Settlement Box */}
      {selectedSession && (
        <div className="bg-white rounded-2xl border-2 border-blue-500 p-6 shadow-md space-y-5 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase text-blue-600">Exit Settlement Calculation</span>
              <h3 className="text-lg font-black text-slate-900">
                Vehicle: {selectedSession.license_plate} (Slot {selectedSession.slot_number})
              </h3>
            </div>
            <button
              onClick={() => setSelectedSession(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel Selection
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Entry Time</span>
              <span className="font-semibold text-slate-800">{new Date(selectedSession.entry_time).toLocaleTimeString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Current Time (Exit)</span>
              <span className="font-semibold text-slate-800">{new Date().toLocaleTimeString()}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Duration</span>
              <span className="font-bold text-slate-900">
                ~{Math.max(1, Math.round((Date.now() - new Date(selectedSession.entry_time).getTime()) / 60000))} mins
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Booking Reference</span>
              <span className="font-mono text-slate-800">{selectedSession.booking_reference || 'Ad-hoc Entry'}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Customer Payment Method:
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['SIMULATED', 'UPI', 'CARD'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition ${
                    paymentMethod === m
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m === 'SIMULATED' ? 'Cash / Simulated' : m}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Triggering exit will close session and release slot back to AVAILABLE immediately.
            </span>
            <button
              onClick={handleProcessExit}
              disabled={processing}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {processing ? 'Processing Exit...' : 'Confirm Exit & Open Barrier'}
            </button>
          </div>
        </div>
      )}

      {/* Exit Success Confirmation Banner */}
      {completedExit && (
        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-6 shadow-sm space-y-4 animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Vehicle Check-Out Complete • Barrier Lifted
              </span>
              <h3 className="text-xl font-black text-slate-900">
                Slot <span className="text-emerald-700">{completedExit.slot_number}</span> has been released back to AVAILABLE
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/80 p-4 rounded-xl border border-emerald-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Vehicle</span>
              <span className="font-mono font-bold text-slate-900">{completedExit.license_plate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Total Duration</span>
              <span className="font-bold text-slate-900">{completedExit.duration_minutes} Minutes</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Final Fee Paid</span>
              <span className="font-black text-emerald-600 text-sm">₹{completedExit.final_amount}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Status</span>
              <span className="font-bold text-emerald-700 uppercase">CLOSED</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
