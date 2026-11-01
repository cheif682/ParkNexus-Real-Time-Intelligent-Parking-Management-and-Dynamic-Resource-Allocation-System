import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Facility, ParkingZone } from '../../types';
import { Building2, Plus, Edit2, Trash2, Layers, X, CheckCircle2 } from 'lucide-react';

export const AdminFacilitiesPage: React.FC = () => {
  const { success, error } = useToast();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  // Facility Modal
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [operatingHours, setOperatingHours] = useState('24/7 Operations');
  const [capacity, setCapacity] = useState(30);

  // Zone Modal
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [targetFacilityId, setTargetFacilityId] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [floorLevel, setFloorLevel] = useState('Ground');
  const [supportedTypes, setSupportedTypes] = useState('FOUR_WHEELER,ELECTRIC_VEHICLE');

  useEffect(() => {
    loadFacilities();
  }, []);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const data = await api.getFacilities();
      setFacilities(data || []);
    } catch (e: any) {
      error(e.message || 'Failed to load facilities');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFacility) {
        await api.updateFacility(editingFacility.id, {
          name,
          code,
          address,
          city,
          operating_hours: operatingHours,
          total_capacity: capacity,
        });
        success(`Facility ${name} updated.`);
      } else {
        await api.createFacility({
          name,
          code,
          address,
          city,
          operating_hours: operatingHours,
          total_capacity: capacity,
        });
        success(`Facility ${name} created.`);
      }
      setShowFacilityModal(false);
      setEditingFacility(null);
      loadFacilities();
    } catch (err: any) {
      error(err.message || 'Operation failed');
    }
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFacilityId || !zoneName) return;

    try {
      await api.createZone(targetFacilityId, {
        name: zoneName,
        floor_level: floorLevel,
        supported_types: supportedTypes,
      });
      success(`Zone ${zoneName} added to facility.`);
      setShowZoneModal(false);
      setZoneName('');
      loadFacilities();
    } catch (err: any) {
      error(err.message || 'Failed to add zone');
    }
  };

  const openEditModal = (fac: Facility) => {
    setEditingFacility(fac);
    setName(fac.name);
    setCode(fac.code);
    setAddress(fac.address);
    setCity(fac.city);
    setOperatingHours(fac.operating_hours);
    setCapacity(fac.total_capacity);
    setShowFacilityModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Facilities & Parking Zones</h2>
          <p className="text-xs text-slate-500 mt-1">Configure physical infrastructure, operating hours, and zone divisions</p>
        </div>

        <button
          onClick={() => {
            setEditingFacility(null);
            setName('');
            setCode('');
            setAddress('');
            setCapacity(30);
            setShowFacilityModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Facility
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading facilities...</div>
      ) : (
        <div className="space-y-5">
          {facilities.map((fac) => (
            <div key={fac.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900">{fac.name}</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                        {fac.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{fac.address}, {fac.city} • {fac.operating_hours}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTargetFacilityId(fac.id);
                      setShowZoneModal(true);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Zone
                  </button>
                  <button
                    onClick={() => openEditModal(fac)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Zones list */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Configured Zones ({fac.zones?.length || 0})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {fac.zones?.map((z) => (
                    <div key={z.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <p className="font-bold text-slate-800">{z.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Floor: {z.floor_level} • {z.total_slots || 0} slots</p>
                      <span className="text-[10px] text-blue-600 block truncate mt-1">
                        {z.supported_types.split(',').join(' • ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Facility Create/Edit Modal */}
      {showFacilityModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingFacility ? 'Edit Facility' : 'Create New Facility'}
              </h3>
              <button onClick={() => setShowFacilityModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFacility} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Indiranagar Metro Deck"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Code *</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. IND-04"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Road, locality, Bengaluru"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    placeholder="24/7 Operations"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Capacity</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowFacilityModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zone Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add Parking Zone</h3>
              <button onClick={() => setShowZoneModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddZone} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Zone Name *</label>
                <input
                  type="text"
                  required
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g. Zone E - Rooftop Solar Deck"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Level</label>
                <input
                  type="text"
                  value={floorLevel}
                  onChange={(e) => setFloorLevel(e.target.value)}
                  placeholder="Ground / Level 1 / Basement 1"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supported Vehicle Types</label>
                <input
                  type="text"
                  value={supportedTypes}
                  onChange={(e) => setSupportedTypes(e.target.value)}
                  placeholder="FOUR_WHEELER,ELECTRIC_VEHICLE"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowZoneModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                >
                  Add Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
