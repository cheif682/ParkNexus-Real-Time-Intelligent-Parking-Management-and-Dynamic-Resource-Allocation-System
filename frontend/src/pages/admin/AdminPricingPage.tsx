import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PricingRule, Facility, VehicleType } from '../../types';
import { CircleDollarSign, Plus, Edit2, X, CheckCircle2 } from 'lucide-react';

export const AdminPricingPage: React.FC = () => {
  const { success, error } = useToast();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit / Create rule modal
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [facilityId, setFacilityId] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('FOUR_WHEELER');
  const [hourlyRate, setHourlyRate] = useState<number>(40);
  const [maxDailyRate, setMaxDailyRate] = useState<number>(300);
  const [gracePeriod, setGracePeriod] = useState<number>(15);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      const [rulesData, facData] = await Promise.all([
        api.getPricingRules(),
        api.getFacilities(),
      ]);
      setRules(rulesData || []);
      setFacilities(facData || []);
    } catch (e: any) {
      error(e.message || 'Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingRule) {
        await api.updatePricingRule(editingRule.id, {
          hourly_rate: hourlyRate,
          max_daily_rate: maxDailyRate,
          grace_period_minutes: gracePeriod,
        });
        success('Pricing rule updated successfully.');
      } else {
        await api.createPricingRule({
          facility_id: facilityId || undefined,
          vehicle_type: vehicleType,
          hourly_rate: hourlyRate,
          max_daily_rate: maxDailyRate,
          grace_period_minutes: gracePeriod,
          cancellation_penalty_pct: 0.0,
        });
        success('New pricing rule added.');
      }
      setShowModal(false);
      setEditingRule(null);
      loadPricingData();
    } catch (err: any) {
      error(err.message || 'Failed to save rule');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (r: PricingRule) => {
    setEditingRule(r);
    setFacilityId(r.facility_id || '');
    setVehicleType(r.vehicle_type);
    setHourlyRate(r.hourly_rate);
    setMaxDailyRate(r.max_daily_rate);
    setGracePeriod(r.grace_period_minutes);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dynamic Pricing Configuration</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure hourly rates, daily caps, and grace periods across vehicle types and facilities
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRule(null);
            setFacilityId('');
            setVehicleType('FOUR_WHEELER');
            setHourlyRate(40);
            setMaxDailyRate(300);
            setGracePeriod(15);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Pricing Rule
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading pricing rules...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Scope / Facility</th>
                  <th className="py-2.5 px-3">Vehicle Category</th>
                  <th className="py-2.5 px-3">Hourly Rate</th>
                  <th className="py-2.5 px-3">Max Daily Cap</th>
                  <th className="py-2.5 px-3">Grace Period</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {r.facility_name || 'Global Default (All facilities)'}
                    </td>
                    <td className="py-3 px-3 font-medium text-blue-600">
                      {r.vehicle_type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 text-sm">₹{r.hourly_rate} / hr</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">₹{r.max_daily_rate} / day</td>
                    <td className="py-3 px-3 text-slate-600">{r.grace_period_minutes} mins free</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {editingRule ? 'Edit Pricing Rule' : 'New Pricing Rule'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Scope</label>
                <select
                  disabled={!!editingRule}
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="">Global Default (All Facilities)</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Category</label>
                <select
                  disabled={!!editingRule}
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="FOUR_WHEELER">Four-Wheeler</option>
                  <option value="ELECTRIC_VEHICLE">Electric Vehicle (EV Charger)</option>
                  <option value="TWO_WHEELER">Two-Wheeler</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hourly Rate (₹) *</label>
                  <input
                    type="number"
                    required
                    step="5"
                    min="1"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Daily Cap (₹) *</label>
                  <input
                    type="number"
                    required
                    step="10"
                    min="1"
                    value={maxDailyRate}
                    onChange={(e) => setMaxDailyRate(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Grace Period (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={gracePeriod}
                  onChange={(e) => setGracePeriod(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Pricing Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
