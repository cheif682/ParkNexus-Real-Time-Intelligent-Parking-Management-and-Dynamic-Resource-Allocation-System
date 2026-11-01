import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Facility, VehicleType } from '../../types';
import {
  Search,
  MapPin,
  Clock,
  Car,
  Zap,
  Bike,
  ShieldCheck,
  ChevronRight,
  Filter,
  ArrowRight,
  Compass,
} from 'lucide-react';

export const FindParkingPage: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('ALL');
  const [minAvailableFilter, setMinAvailableFilter] = useState(false);

  // Discovery parameters
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [arrivalTime, setArrivalTime] = useState('10:00');
  const [durationHours, setDurationHours] = useState('2');

  useEffect(() => {
    loadFacilities();
  }, [search]);

  const loadFacilities = async () => {
    try {
      setLoading(true);
      const data = await api.getFacilities(search || undefined);
      setFacilities(data || []);
    } catch (e) {
      console.error('Error fetching facilities:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredFacilities = facilities.filter((f) => {
    if (minAvailableFilter && (f.available_slots || 0) <= 0) return false;
    return true;
  });

  const handleStartBooking = (facilityId: string) => {
    navigate(`/customer/reserve?facility_id=${facilityId}&date=${selectedDate}&time=${arrivalTime}&duration=${durationHours}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Find Parking Spaces</h2>
        <p className="text-xs text-slate-500 mt-1">
          Explore smart facilities across Bengaluru with live sensor availability and dynamic pricing
        </p>
      </div>

      {/* Discovery & Search Bar Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Location */}
          <div className="relative md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Location or Facility Name
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search MG Road, Tech Park, Indiranagar..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              min={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>

          {/* Arrival Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Arrival Time
            </label>
            <input
              type="time"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50/50"
            />
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Vehicle Category:</span>
            {['ALL', 'FOUR_WHEELER', 'ELECTRIC_VEHICLE', 'TWO_WHEELER'].map((type) => (
              <button
                key={type}
                onClick={() => setVehicleTypeFilter(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  vehicleTypeFilter === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'ALL' ? 'All Vehicles' : type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={minAvailableFilter}
              onChange={(e) => setMinAvailableFilter(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Show available only</span>
          </label>
        </div>
      </div>

      {/* Facility Results Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading parking facilities...
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-400 text-sm">
          No parking facilities found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((fac) => {
            const occ = fac.occupancy_percentage || 0;
            const freeSlots = fac.available_slots || 0;

            return (
              <div
                key={fac.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
                        {fac.code}
                      </span>
                      <h3 className="font-bold text-lg text-slate-900 mt-2 group-hover:text-blue-600 transition">
                        {fac.name}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="line-clamp-1">{fac.address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{fac.operating_hours}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-semibold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>EV Hub Equipped</span>
                    </div>
                  </div>

                  {/* Occupancy and Capacity Stats */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Available Capacity:</span>
                      <span className="font-bold text-emerald-600">
                        {freeSlots} Free <span className="font-normal text-slate-400">/ {fac.total_capacity} Slots</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          occ > 80 ? 'bg-rose-500' : occ > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occ}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{occ}% Occupancy</span>
                      <span>{fac.zones?.length || 4} Zones</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/customer/facility/${fac.id}`)}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                  >
                    View Slot Map
                  </button>
                  <button
                    onClick={() => handleStartBooking(fac.id)}
                    className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm flex items-center justify-center gap-1"
                  >
                    Reserve Now <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
