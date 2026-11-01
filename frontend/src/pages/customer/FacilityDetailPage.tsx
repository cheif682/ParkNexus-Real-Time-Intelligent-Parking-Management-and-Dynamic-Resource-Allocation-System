import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Facility, ParkingSlot } from '../../types';
import { SlotGrid } from '../../components/parking/SlotGrid';
import {
  MapPin,
  Clock,
  Building2,
  CalendarCheck,
  ChevronLeft,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const FacilityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [facility, setFacility] = useState<Facility | null>(null);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

  useEffect(() => {
    if (id) {
      loadFacilityData(id);
    }
  }, [id]);

  const loadFacilityData = async (facId: string) => {
    try {
      setLoading(true);
      const [facData, slotsData] = await Promise.all([
        api.getFacility(facId),
        api.getSlotsByFacility(facId),
      ]);
      setFacility(facData);
      setSlots(slotsData || []);
    } catch (e) {
      console.error('Failed to load facility detail:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-400">Loading facility details...</div>;
  }

  if (!facility) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        Facility not found.
        <button onClick={() => navigate(-1)} className="mt-2 block mx-auto text-blue-600 font-medium">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and facility title */}
      <div>
        <button
          onClick={() => navigate('/customer/find-parking')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Facilities
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase">
                {facility.code}
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{facility.name}</h2>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{facility.address}, {facility.city}</span>
            </p>
          </div>

          <button
            onClick={() => navigate(`/customer/reserve?facility_id=${facility.id}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm"
          >
            <CalendarCheck className="w-4 h-4" />
            Reserve a Slot Here
          </button>
        </div>
      </div>

      {/* Facility Statistics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Slots</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{facility.total_capacity}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Available Free</span>
          <span className="text-xl font-bold text-emerald-600 mt-1 block">{facility.available_slots}</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Occupancy Rate</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{facility.occupancy_percentage}%</span>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Operating Hours</span>
          <span className="text-sm font-semibold text-slate-800 mt-1.5 block">{facility.operating_hours}</span>
        </div>
      </div>

      {/* Interactive Slot Grid */}
      <SlotGrid
        slots={slots}
        selectedSlotId={selectedSlot?.id}
        onSelectSlot={(s) => setSelectedSlot(s)}
        selectable={true}
      />

      {/* Selected Slot Drawer / Banner */}
      {selectedSlot && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase">Selected Slot</span>
            <p className="text-sm font-bold text-slate-900">
              {selectedSlot.slot_number} ({selectedSlot.category.replace('_', ' ')}) — Zone: {selectedSlot.zone_name}
            </p>
          </div>
          <button
            onClick={() =>
              navigate(`/customer/reserve?facility_id=${facility.id}&slot_id=${selectedSlot.id}`)
            }
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            Proceed with Slot {selectedSlot.slot_number} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
