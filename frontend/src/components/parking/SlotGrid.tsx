import React, { useState } from 'react';
import { ParkingSlot, SlotCategory, SlotStatus } from '../../types';
import { Car, Zap, Accessibility, Bike, Wrench, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SlotGridProps {
  slots: ParkingSlot[];
  selectedSlotId?: string;
  onSelectSlot?: (slot: ParkingSlot) => void;
  selectable?: boolean;
  onToggleMaintenance?: (slot: ParkingSlot) => void;
  allowMaintenanceToggle?: boolean;
  filterZoneId?: string;
}

export const SlotGrid: React.FC<SlotGridProps> = ({
  slots,
  selectedSlotId,
  onSelectSlot,
  selectable = false,
  onToggleMaintenance,
  allowMaintenanceToggle = false,
  filterZoneId,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredSlots = slots.filter((s) => {
    if (filterZoneId && s.zone_id !== filterZoneId) return false;
    if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
    return true;
  });

  const getCategoryIcon = (category: SlotCategory) => {
    switch (category) {
      case 'TWO_WHEELER':
        return (
          <span title="Two-Wheeler Slot">
            <Bike className="w-3.5 h-3.5 text-blue-600" />
          </span>
        );
      case 'ELECTRIC_VEHICLE':
        return (
          <span title="Dedicated EV Charger">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
          </span>
        );
      case 'ACCESSIBLE':
        return (
          <span title="Accessible Parking">
            <Accessibility className="w-3.5 h-3.5 text-purple-600" />
          </span>
        );
      default:
        return (
          <span title="Standard Four-Wheeler">
            <Car className="w-3.5 h-3.5 text-slate-600" />
          </span>
        );
    }
  };

  const getStatusStyles = (status: SlotStatus, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400 ring-offset-1';
    }
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50/80 text-emerald-900 border-emerald-300 hover:border-emerald-500 hover:bg-emerald-100/80 cursor-pointer shadow-sm';
      case 'OCCUPIED':
        return 'bg-rose-50 text-rose-800 border-rose-300 cursor-not-allowed opacity-90';
      case 'RESERVED':
        return 'bg-amber-50 text-amber-900 border-amber-300 cursor-not-allowed opacity-95';
      case 'MAINTENANCE':
        return 'bg-slate-100 text-slate-500 border-slate-300 cursor-not-allowed';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const countByStatus = {
    available: slots.filter((s) => s.status === 'AVAILABLE').length,
    occupied: slots.filter((s) => s.status === 'OCCUPIED').length,
    reserved: slots.filter((s) => s.status === 'RESERVED').length,
    maintenance: slots.filter((s) => s.status === 'MAINTENANCE').length,
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Interactive Parking Slot Map</h3>
          <p className="text-xs text-slate-500">Live operational status reflecting relational database records</p>
        </div>

        {/* Filter category */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            <option value="FOUR_WHEELER">Four-Wheeler</option>
            <option value="ELECTRIC_VEHICLE">Electric Vehicle (EV)</option>
            <option value="TWO_WHEELER">Two-Wheeler</option>
            <option value="ACCESSIBLE">Accessible</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-600 inline-block" />
          <span className="text-slate-700">Available ({countByStatus.available})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-rose-500 border border-rose-600 inline-block" />
          <span className="text-slate-700">Occupied ({countByStatus.occupied})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-400 border border-amber-500 inline-block" />
          <span className="text-slate-700">Reserved ({countByStatus.reserved})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-slate-400 border border-slate-500 inline-block" />
          <span className="text-slate-700">Maintenance ({countByStatus.maintenance})</span>
        </div>
      </div>

      {/* Slot Grid Container */}
      {filteredSlots.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          No parking slots found matching the criteria.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[460px] overflow-y-auto p-1">
          {filteredSlots.map((slot) => {
            const isSelected = selectedSlotId === slot.id;
            const isAvailable = slot.status === 'AVAILABLE';

            return (
              <div
                key={slot.id}
                onClick={() => {
                  if (selectable && isAvailable && onSelectSlot) {
                    onSelectSlot(slot);
                  }
                }}
                className={`relative flex flex-col justify-between p-3 rounded-lg border transition-all duration-150 ${getStatusStyles(
                  slot.status,
                  isSelected
                )}`}
              >
                {/* Top: Slot number & Category icon */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                    {slot.slot_number}
                  </span>
                  <div className={`p-1 rounded ${isSelected ? 'bg-blue-500/50' : 'bg-white/80'}`}>
                    {getCategoryIcon(slot.category)}
                  </div>
                </div>

                {/* Zone name */}
                <span className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {slot.zone_name || 'Ground'}
                </span>

                {/* Status pill & Actions */}
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      isSelected
                        ? 'bg-white text-blue-700'
                        : slot.status === 'AVAILABLE'
                        ? 'bg-emerald-200/80 text-emerald-900'
                        : slot.status === 'OCCUPIED'
                        ? 'bg-rose-200/80 text-rose-900'
                        : slot.status === 'RESERVED'
                        ? 'bg-amber-200/80 text-amber-900'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {isSelected ? 'SELECTED' : slot.status}
                  </span>

                  {allowMaintenanceToggle && onToggleMaintenance && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMaintenance(slot);
                      }}
                      title={slot.status === 'MAINTENANCE' ? 'Restore slot' : 'Mark maintenance'}
                      className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                    >
                      <Wrench className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
