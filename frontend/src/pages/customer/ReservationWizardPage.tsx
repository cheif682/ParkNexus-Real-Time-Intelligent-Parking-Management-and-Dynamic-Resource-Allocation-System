import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Facility, Vehicle, ParkingSlot, AllocationRecommendation, Reservation } from '../../types';
import {
  Car,
  Compass,
  CalendarCheck,
  Clock,
  Sparkles,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Building2,
  Printer,
} from 'lucide-react';

export const ReservationWizardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Form selections
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(searchParams.get('facility_id') || '');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(searchParams.get('date') || todayStr);
  const [time, setTime] = useState<string>(searchParams.get('time') || '10:00');
  const [durationHours, setDurationHours] = useState<number>(parseInt(searchParams.get('duration') || '2', 10));

  // Dynamic Allocation Recommendation
  const [recommendation, setRecommendation] = useState<AllocationRecommendation | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);

  // Payment & Confirmation
  const [paymentMethod, setPaymentMethod] = useState<string>('SIMULATED');
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    try {
      setLoading(true);
      const [facList, vehList] = await Promise.all([
        api.getFacilities(),
        api.getVehicles(),
      ]);
      setFacilities(facList || []);
      setVehicles(vehList || []);

      if (!selectedFacilityId && facList.length > 0) {
        setSelectedFacilityId(facList[0].id);
      }

      const defaultVeh = vehList.find((v) => v.is_default) || vehList[0];
      if (defaultVeh) {
        setSelectedVehicleId(defaultVeh.id);
      }
    } catch (e) {
      error('Failed to load reservation requirements');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAllocation = async () => {
    if (!selectedFacilityId || !selectedVehicleId) {
      error('Please select both a parking facility and your vehicle');
      return;
    }

    try {
      setLoading(true);
      const startDateTime = new Date(`${date}T${time}:00Z`);
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 3600 * 1000);

      const rec = await api.getRecommendedSlot({
        facility_id: selectedFacilityId,
        vehicle_id: selectedVehicleId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      });

      setRecommendation(rec);
      if (rec.is_available && rec.recommended_slot) {
        setSelectedSlot(rec.recommended_slot);
        setCurrentStep(2);
      } else {
        error(rec.explanation || 'No available slots found for requested period.');
      }
    } catch (err: any) {
      error(err.message || 'Dynamic allocation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAndPay = async () => {
    if (!selectedSlot || !selectedFacilityId || !selectedVehicleId) return;

    try {
      setLoading(true);
      const startDateTime = new Date(`${date}T${time}:00Z`);
      const endDateTime = new Date(startDateTime.getTime() + durationHours * 3600 * 1000);

      // 1. Create reservation
      const res = await api.createReservation({
        facility_id: selectedFacilityId,
        vehicle_id: selectedVehicleId,
        slot_id: selectedSlot.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      });

      // 2. Process simulated payment idempotently
      const idemKey = `PAY-RES-${res.id}-${Date.now()}`;
      await api.processPayment({
        reservation_id: res.id,
        amount: res.estimated_amount,
        payment_method: paymentMethod,
        idempotency_key: idemKey,
      });

      setConfirmedReservation(res);
      success(`Booking ${res.booking_reference} confirmed successfully!`);
      setCurrentStep(3);
    } catch (err: any) {
      error(err.message || 'Booking confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Wizard Progress Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              1
            </span>
            <span className={currentStep >= 1 ? 'text-slate-900 font-bold' : 'text-slate-400'}>
              Preferences & Time
            </span>
          </div>

          <div className="h-0.5 w-12 bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              2
            </span>
            <span className={currentStep >= 2 ? 'text-slate-900 font-bold' : 'text-slate-400'}>
              Allocation & Review
            </span>
          </div>

          <div className="h-0.5 w-12 bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                currentStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              3
            </span>
            <span className={currentStep >= 3 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
              Confirmed
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: CONFIGURATION & CRITERIA */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Reserve a Parking Slot</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select your destination facility, vehicle, and arrival schedule to run dynamic slot matching.
            </p>
          </div>

          <div className="space-y-4">
            {/* Facility Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Parking Facility
              </label>
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.code}) — {fac.available_slots} slots available
                  </option>
                ))}
              </select>
            </div>

            {/* Vehicle Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Registered Vehicle
                </label>
                <Link to="/customer/vehicles" className="text-xs text-blue-600 hover:underline">
                  + Add new vehicle
                </Link>
              </div>

              {vehicles.length === 0 ? (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                  <span>You have not registered any vehicles yet.</span>
                  <Link to="/customer/vehicles" className="font-bold underline">
                    Add Vehicle Now
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicles.map((v) => {
                    const isSelected = selectedVehicleId === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="font-mono font-bold text-slate-900 text-sm">{v.license_plate}</p>
                          <p className="text-xs text-slate-500">{v.make_model} ({v.vehicle_type.replace('_', ' ')})</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Date, Time & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reservation Date
                </label>
                <input
                  type="date"
                  value={date}
                  min={todayStr}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Arrival Time (UTC)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration (Hours)
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value={1}>1 Hour</option>
                  <option value={2}>2 Hours</option>
                  <option value={3}>3 Hours</option>
                  <option value={4}>4 Hours</option>
                  <option value={6}>6 Hours</option>
                  <option value={8}>8 Hours (Full Day)</option>
                  <option value={12}>12 Hours</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleRunAllocation}
              disabled={loading || vehicles.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Executing Dynamic Allocation...' : 'Find & Allocate Best Slot'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ALLOCATION RECOMMENDATION & REVIEW */}
      {currentStep === 2 && recommendation && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              Algorithm Recommendation
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Recommended Parking Space</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by multi-factor score: vehicle compatibility, duration window, floor level and gate proximity.
            </p>
          </div>

          {/* Primary Recommended Slot Card */}
          {recommendation.recommended_slot && (
            <div className="bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border-2 border-blue-500 rounded-2xl p-6 relative">
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Score: {recommendation.score} pts
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                  <span className="text-[10px] uppercase font-bold text-blue-200">SLOT</span>
                  <span className="text-lg font-black tracking-tight leading-none">
                    {recommendation.recommended_slot.slot_number}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-lg">
                    {recommendation.recommended_slot.slot_number} — {recommendation.recommended_slot.zone_name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {recommendation.explanation}
                  </p>
                </div>
              </div>

              {/* Rationale breakdown */}
              <div className="mt-4 pt-4 border-t border-blue-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Facility</span>
                  <span className="font-semibold text-slate-800">{selectedFacility?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Vehicle</span>
                  <span className="font-semibold text-slate-800">{selectedVehicle?.license_plate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Duration</span>
                  <span className="font-semibold text-slate-800">{durationHours} Hours</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Estimated Price</span>
                  <span className="font-extrabold text-blue-700 text-sm">₹{recommendation.estimated_amount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Alternative Slots */}
          {recommendation.alternative_slots.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Available Alternative Slots (Click to choose another bay):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {recommendation.alternative_slots.map((alt) => {
                  const isAltSelected = selectedSlot?.id === alt.id;
                  return (
                    <div
                      key={alt.id}
                      onClick={() => setSelectedSlot(alt)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                        isAltSelected
                          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-500 font-bold text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-mono font-bold text-sm">{alt.slot_number}</p>
                        <p className="text-[10px] text-slate-500">{alt.zone_name}</p>
                      </div>
                      {isAltSelected && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Payment Method (Simulation Mode Active)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'SIMULATED', label: 'Simulated Sandbox', desc: 'Instant authorization' },
                { id: 'UPI', label: 'UPI / QR', desc: 'GPay / PhonePe / Paytm' },
                { id: 'CARD', label: 'Credit / Debit Card', desc: 'Visa / Mastercard' },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    paymentMethod === m.id
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900">{m.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" /> Change Criteria
            </button>

            <button
              onClick={handleConfirmAndPay}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Confirming Reservation...' : `Pay ₹${recommendation.estimated_amount} & Reserve Slot`}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: BOOKING CONFIRMED SCREEN */}
      {currentStep === 3 && confirmedReservation && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 text-center animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
              Booking Confirmed
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {confirmedReservation.booking_reference}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your parking slot is securely reserved. Please present this reference or license plate at the entry gate.
            </p>
          </div>

          {/* Ticket Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left max-w-lg mx-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Facility</span>
                <span className="font-bold text-slate-900 text-sm">{confirmedReservation.facility_name}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Allocated Slot</span>
                <span className="font-black text-blue-600 text-lg">{confirmedReservation.slot_number}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Vehicle Registration</span>
                <span className="font-mono font-bold text-slate-800">{confirmedReservation.license_plate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Estimated Fee Paid</span>
                <span className="font-bold text-slate-900">₹{confirmedReservation.estimated_amount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Scheduled Start</span>
                <span className="font-medium text-slate-700">
                  {new Date(confirmedReservation.start_time).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Scheduled End</span>
                <span className="font-medium text-slate-700">
                  {new Date(confirmedReservation.end_time).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" /> Print Confirmation
            </button>
            <Link
              to="/customer/reservations"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
            >
              View in My Reservations →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
