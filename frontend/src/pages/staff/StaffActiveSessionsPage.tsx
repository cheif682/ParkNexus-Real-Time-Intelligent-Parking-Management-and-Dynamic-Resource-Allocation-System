import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { ParkingSession, Facility } from '../../types';
import { Clock, Search, LogOut, Car } from 'lucide-react';

export const StaffActiveSessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 15000);
    return () => clearInterval(interval);
  }, [selectedFacilityId]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const facList = await api.getFacilities();
      setFacilities(facList || []);
      const fid = selectedFacilityId || (facList.length > 0 ? facList[0].id : undefined);
      const data = await api.getActiveSessions(fid);
      setSessions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = sessions.filter((s) => {
    if (search && !s.license_plate?.toLowerCase().includes(search.toLowerCase()) && !s.slot_number?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Active Parked Vehicles</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time surveillance of occupied bays across the facility</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-semibold"
          >
            <option value="">All Facilities</option>
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name}
              </option>
            ))}
          </select>

          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter slot or plate..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading active sessions...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No active vehicles currently parked.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => {
              const entryDate = new Date(s.entry_time);
              const elapsedMins = Math.max(1, Math.round((Date.now() - entryDate.getTime()) / 60000));
              return (
                <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-slate-900 text-base">{s.license_plate}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-600 text-white">
                        {s.slot_number}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{s.vehicle_make_model}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{s.facility_name}</p>

                    <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-600">
                      <p>Entry: {entryDate.toLocaleTimeString()}</p>
                      <p className="font-bold text-slate-900 mt-0.5">Parked for: {elapsedMins} mins</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={() => navigate(`/staff/check-out?session_id=${s.id}`)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Check Out
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
