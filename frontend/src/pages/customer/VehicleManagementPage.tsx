import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Vehicle, VehicleType } from '../../types';
import { Car, Plus, Trash2, CheckCircle2, Star, X } from 'lucide-react';

export const VehicleManagementPage: React.FC = () => {
  const { success, error } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [plate, setPlate] = useState('');
  const [makeModel, setMakeModel] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('FOUR_WHEELER');
  const [color, setColor] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await api.getVehicles();
      setVehicles(data || []);
    } catch (e: any) {
      error(e.message || 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate || !makeModel) return;

    try {
      setSubmitting(true);
      await api.addVehicle({
        license_plate: plate.trim().toUpperCase(),
        make_model: makeModel.trim(),
        vehicle_type: vehicleType,
        color: color.trim() || undefined,
        is_default: isDefault,
      });

      success(`Vehicle ${plate.toUpperCase()} registered successfully!`);
      setShowAddModal(false);
      setPlate('');
      setMakeModel('');
      setColor('');
      setIsDefault(false);
      loadVehicles();
    } catch (err: any) {
      error(err.message || 'Failed to add vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId: string, plateNum: string) => {
    if (!confirm(`Are you sure you want to delete vehicle ${plateNum}?`)) return;

    try {
      await api.deleteVehicle(vehicleId);
      success(`Vehicle ${plateNum} deleted.`);
      loadVehicles();
    } catch (err: any) {
      error(err.message || 'Could not delete vehicle');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Vehicle Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Register and manage vehicles for automated license plate check-in and dynamic slot compatibility
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {/* Vehicle Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Loading vehicles...</div>
      ) : vehicles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Car className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-900 text-base">No registered vehicles</h4>
          <p className="text-xs text-slate-500">
            Add your car or two-wheeler to begin making automated parking reservations.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Add Your First Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => (
            <div
              key={v.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition flex flex-col justify-between ${
                v.is_default ? 'border-blue-400 ring-1 ring-blue-200' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-mono font-black text-slate-900 text-base tracking-wide">
                        {v.license_plate}
                      </span>
                      {v.is_default && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <Star className="w-2.5 h-2.5 fill-blue-600" /> Default
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(v.id, v.license_plate)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Make & Model</span>
                    <span className="font-semibold text-slate-800">{v.make_model}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Category</span>
                    <span className="font-semibold text-slate-800">{v.vehicle_type.replace('_', ' ')}</span>
                  </div>
                  {v.color && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Color</span>
                      <span className="text-slate-700">{v.color}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <span className="text-[10px] text-slate-400 font-mono">
                  Registered {new Date(v.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Add New Vehicle</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  License Plate Number *
                </label>
                <input
                  type="text"
                  required
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. KA-01-AB-1234"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Make & Model *
                </label>
                <input
                  type="text"
                  required
                  value={makeModel}
                  onChange={(e) => setMakeModel(e.target.value)}
                  placeholder="e.g. Honda City or Ather 450X"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="FOUR_WHEELER">Four-Wheeler (Car / Sedan / SUV)</option>
                  <option value="ELECTRIC_VEHICLE">Electric Vehicle (EV Charging Bay)</option>
                  <option value="TWO_WHEELER">Two-Wheeler (Motorcycle / Scooter)</option>
                  <option value="OTHER">Other Supported Vehicle</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Color (Optional)
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="e.g. White, Black, Red"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Set as default vehicle for quick reservations</span>
              </label>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
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
                  {submitting ? 'Saving...' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
