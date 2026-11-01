import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Facility, ParkingZone, ParkingSlot, SlotCategory, SlotStatus } from '../../types';
import { SlotGrid } from '../../components/parking/SlotGrid';
import { Layers, Plus, Wrench, X, Filter, CheckCircle2 } from 'lucide-react';

export const AdminSlotsPage: React.FC = () => {
  const { success, error } = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [zones, setZones] = useState<ParkingZone[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Add slot modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [slotNumber, setSlotNumber] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [category, setCategory] = useState<SlotCategory>('FOUR_WHEELER');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadFacilities();
  }, []);

  useEffect(() => {
    if (selectedFacilityId) {
      loadFacilitySlotsAndZones(selectedFacilityId);
    }
  }, [selectedFacilityId]);

  const loadFacilities = async () => {
    try {
      const data = await api.getFacilities();
      setFacilities(data || []);
      if (data.length > 0 && !selectedFacilityId) {
        setSelectedFacilityId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadFacilitySlotsAndZones = async (facId: string) => {
    try {
      setLoading(true);
      const [zonesData, slotsData] = await Promise.all([
        api.getZonesByFacility(facId),
        api.getSlotsByFacility(facId),
      ]);
      setZones(zonesData || []);
      setSlots(slotsData || []);
      if (zonesData.length > 0) {
        setSelectedZoneId(zonesData[0].id);
      }
    } catch (e: any) {
      error(e.message || 'Failed to load slots');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenance = async (slot: ParkingSlot) => {
    const isMaint = slot.status === 'MAINTENANCE';
    try {
      await api.toggleSlotMaintenance(slot.id, !isMaint);
      success(`Slot ${slot.slot_number} maintenance status set to ${!isMaint ? 'Active' : 'Cleared'}.`);
      loadFacilitySlotsAndZones(selectedFacilityId);
    } catch (err: any) {
      error(err.message || 'Failed to update maintenance state');
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotNumber || !selectedZoneId || !selectedFacilityId) return;

    try {
      setSubmitting(true);
      await api.createSlot({
        facility_id: selectedFacilityId,
        zone_id: selectedZoneId,
        slot_number: slotNumber.trim().toUpperCase(),
        category,
        status: 'AVAILABLE',
      });
      success(`Slot ${slotNumber.toUpperCase()} created successfully.`);
      setShowAddModal(false);
      setSlotNumber('');
      loadFacilitySlotsAndZones(selectedFacilityId);
    } catch (err: any) {
      error(err.message || 'Failed to add slot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Parking Slot Configuration</h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage individual bays, assign vehicle categories, and toggle operational maintenance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 font-semibold"
          >
            {facilities.map((fac) => (
              <option key={fac.id} value={fac.id}>
                {fac.name} ({fac.code})
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add Slot
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading slots...</div>
      ) : (
        <SlotGrid
          slots={slots}
          selectable={false}
          allowMaintenanceToggle={true}
          onToggleMaintenance={handleToggleMaintenance}
        />
      )}

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Parking Slot</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Slot Identifier *</label>
                <input
                  type="text"
                  required
                  value={slotNumber}
                  onChange={(e) => setSlotNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. A-15 or EV-09"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parking Zone *</label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} (Floor: {z.floor_level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SlotCategory)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="FOUR_WHEELER">Four-Wheeler (Standard)</option>
                  <option value="ELECTRIC_VEHICLE">Electric Vehicle (Dedicated EV Charger)</option>
                  <option value="TWO_WHEELER">Two-Wheeler Bay</option>
                  <option value="ACCESSIBLE">Accessible Bay</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
