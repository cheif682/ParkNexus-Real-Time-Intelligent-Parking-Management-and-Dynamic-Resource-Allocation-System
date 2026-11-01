import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Facility } from '../../types';
import {
  Car,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
  ChevronRight,
  CheckCircle2,
  Building2,
  Sparkles,
  Users,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLiveFacilities();
  }, []);

  const loadLiveFacilities = async () => {
    try {
      const data = await api.getFacilities();
      setFacilities(data.slice(0, 3));
    } catch (e) {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (email: string, roleRoute: string) => {
    try {
      await login(email, email.startsWith('admin') ? 'Admin@123' : email.startsWith('staff') ? 'Staff@123' : 'Customer@123');
      navigate(roleRoute);
    } catch (e) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Navigation Bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-extrabold text-base">
              PN
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight">ParkNexus</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                BEA Edition
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={
                  user.role === 'ADMIN'
                    ? '/admin/dashboard'
                    : user.role === 'PARKING_STAFF'
                    ? '/staff/dashboard'
                    : '/customer/dashboard'
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition shadow-sm"
              >
                Go to Workspace <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-slate-700 hover:text-slate-900 font-medium text-sm transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition shadow-sm"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Demo Quick-Access Evaluation Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white py-3 px-4 shadow-inner">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              ACADEMIC EVALUATION READY
            </span>
            <span className="text-slate-300 hidden md:inline">
              Instant login buttons to test all roles without manual credential typing:
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleQuickDemoLogin('admin@parknexus.com', '/admin/dashboard')}
              className="px-2.5 py-1 rounded bg-purple-600/80 hover:bg-purple-600 text-white font-medium transition"
            >
              Demo Admin (Rajesh)
            </button>
            <button
              onClick={() => handleQuickDemoLogin('staff.btp@parknexus.com', '/staff/dashboard')}
              className="px-2.5 py-1 rounded bg-amber-600/80 hover:bg-amber-600 text-white font-medium transition"
            >
              Demo Staff (Suresh)
            </button>
            <button
              onClick={() => handleQuickDemoLogin('arun.kumar@gmail.com', '/customer/dashboard')}
              className="px-2.5 py-1 rounded bg-blue-600/80 hover:bg-blue-600 text-white font-medium transition"
            >
              Demo Customer (Arun)
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          Intelligent Operations & Dynamic Resource Allocation Platform
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Parking, <span className="text-blue-600">intelligently</span> managed.
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
          Discover available spaces, reserve your spot and experience a smarter way to park. One platform for seamless parking operations.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/customer/find-parking"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition shadow-lg shadow-blue-500/25"
          >
            Find Parking <Compass className="w-5 h-5" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-700 font-semibold text-base hover:bg-slate-100 border border-slate-200 transition shadow-sm"
          >
            Explore Platform <ChevronRight className="w-5 h-5" />
          </a>
        </div>

        {/* Live Facility Cards Preview */}
        <div className="mt-16 text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Live Bengaluru Facility Availability
            </h2>
            <Link to="/customer/find-parking" className="text-xs text-blue-600 font-semibold hover:underline">
              View all facilities →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {facilities.map((fac) => {
              const occPct = fac.occupancy_percentage || 0;
              return (
                <div
                  key={fac.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase">
                        {fac.code}
                      </span>
                      <h3 className="font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition">
                        {fac.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{fac.address}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Available Slots</span>
                      <span className="font-bold text-emerald-600 text-base">
                        {fac.available_slots} <span className="text-xs font-normal text-slate-400">/ {fac.total_capacity}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Occupancy</span>
                      <span className="font-semibold text-slate-700">{occPct}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        occPct > 80 ? 'bg-rose-500' : occPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${occPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Seamless Journey</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">How ParkNexus Works</p>
            <p className="mt-3 text-slate-600 text-sm">
              From real-time discovery to automated checkout in four effortless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Find a parking facility',
                desc: 'Browse facilities by location, vehicle compatibility, operating hours and live rates.',
                icon: Building2,
              },
              {
                step: '02',
                title: 'Choose a suitable slot',
                desc: 'Our dynamic allocation algorithm scores and recommends the optimal available bay.',
                icon: Layers,
              },
              {
                step: '03',
                title: 'Reserve your parking',
                desc: 'Lock in your booking reference with guaranteed double-booking prevention.',
                icon: ShieldCheck,
              },
              {
                step: '04',
                title: 'Arrive, park and exit',
                desc: 'Staff checks in your vehicle via license plate. On exit, final fee is calculated automatically.',
                icon: Car,
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative p-6 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center mb-4 shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 block mb-1">STEP {s.step}</span>
                  <h4 className="font-bold text-slate-900 text-base">{s.title}</h4>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Enterprise Platform Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Enterprise Architecture</h2>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">Built for Modern Mobility Operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Zap className="w-8 h-8 text-blue-600 mb-4" />
            <h3 className="font-bold text-slate-900 text-lg">Dynamic Resource Allocation</h3>
            <p className="mt-2 text-slate-600 text-xs leading-relaxed">
              Transparent multi-factor rule engine that factors vehicle categories, zone preferences, and live duration windows without blackbox heuristics.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Clock className="w-8 h-8 text-emerald-600 mb-4" />
            <h3 className="font-bold text-slate-900 text-lg">Real-Time State Synchronization</h3>
            <p className="mt-2 text-slate-600 text-xs leading-relaxed">
              Authoritative database constraints and transactional status transitions guarantee zero overlapping double-bookings.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Users className="w-8 h-8 text-purple-600 mb-4" />
            <h3 className="font-bold text-slate-900 text-lg">Role-Based Access Control</h3>
            <p className="mt-2 text-slate-600 text-xs leading-relaxed">
              Three tailored applications: self-service Customer portal, high-throughput Staff gate console, and comprehensive Admin dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              PN
            </div>
            <span className="font-bold text-white text-sm">ParkNexus</span>
            <span className="text-slate-500">| Building Enterprise Applications (BEA)</span>
          </div>

          <p className="text-slate-500 text-center sm:text-right">
            © 2026 ParkNexus Enterprise Parking Systems. All demonstration data seeded for academic review.
          </p>
        </div>
      </footer>
    </div>
  );
};
