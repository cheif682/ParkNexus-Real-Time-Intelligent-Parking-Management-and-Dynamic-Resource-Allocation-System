import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ParkingSession } from '../../types';
import { Clock, Car, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';

export const ParkingSessionsPage: React.FC = () => {
  const { error } = useToast();
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 20000); // 20s poll
    return () => clearInterval(interval);
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await api.getSessions();
      setSessions(data || []);
    } catch (e: any) {
      error(e.message || 'Failed to load parking sessions');
    } finally {
      setLoading(false);
    }
  };

  const activeSessions = sessions.filter((s) => s.status === 'ACTIVE');
  const pastSessions = sessions.filter((s) => s.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Parking Sessions</h2>
        <p className="text-xs text-slate-500 mt-1">
          Monitor your ongoing parked vehicle status, entry timestamps, and completed session history
        </p>
      </div>

      {/* Active Session Highlight */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
            Currently Parked Vehicle
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-mono font-black text-slate-900 text-base">{sess.license_plate}</p>
                      <p className="text-xs text-slate-600">{sess.vehicle_make_model}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900 animate-pulse">
                    ACTIVE NOW
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-white/70 p-3 rounded-xl border border-amber-200/50">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Facility</span>
                    <span className="font-bold text-slate-800">{sess.facility_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Assigned Slot</span>
                    <span className="font-black text-blue-600 text-sm">{sess.slot_number}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Entry Timestamp</span>
                    <span className="font-medium text-slate-700">
                      {new Date(sess.entry_time).toLocaleTimeString()} ({new Date(sess.entry_time).toLocaleDateString()})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Booking Ref</span>
                    <span className="font-mono text-slate-700">{sess.booking_reference || 'N/A'}</span>
                  </div>
                </div>

                <p className="text-[11px] text-amber-800 italic">
                  Note: Final parking fee will be calculated automatically by gate staff at exit.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Completed Sessions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Completed Sessions History</h3>

        {pastSessions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No completed parking sessions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Entry Time</th>
                  <th className="py-2.5 px-3">Exit Time</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Final Fee</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pastSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{s.license_plate}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{s.facility_name}</td>
                    <td className="py-3 px-3 font-bold text-blue-600">{s.slot_number}</td>
                    <td className="py-3 px-3">{new Date(s.entry_time).toLocaleString()}</td>
                    <td className="py-3 px-3">{s.exit_time ? new Date(s.exit_time).toLocaleString() : 'N/A'}</td>
                    <td className="py-3 px-3">{s.duration_minutes || 0} mins</td>
                    <td className="py-3 px-3 font-bold text-slate-900">₹{s.final_amount || 0}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.status}
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
