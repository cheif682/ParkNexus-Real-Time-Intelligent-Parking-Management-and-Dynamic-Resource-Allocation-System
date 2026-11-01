import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Car, Lock, Mail, ArrowRight, ShieldAlert, Sparkles, Check } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const user = await login(email, password);
      success(`Welcome back, ${user.full_name}!`);
      
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'PARKING_STAFF') {
        navigate('/staff/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password');
      error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-blue-500/20">
            PN
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">ParkNexus</span>
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Or{' '}
          <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 hover:underline">
            create a new customer account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-5 rounded-lg bg-rose-50 border border-rose-200 p-3.5 flex items-center gap-2.5 text-xs text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign in'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Demo Accounts for BEA Evaluator
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@parknexus.com', 'Admin@123')}
                className="p-2 rounded-lg border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-[11px] font-semibold text-purple-900 text-center transition"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('staff.btp@parknexus.com', 'Staff@123')}
                className="p-2 rounded-lg border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-[11px] font-semibold text-amber-900 text-center transition"
              >
                Staff (Gate)
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('arun.kumar@gmail.com', 'Customer@123')}
                className="p-2 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-[11px] font-semibold text-blue-900 text-center transition"
              >
                Customer
              </button>
            </div>
            <p className="mt-2 text-[10px] text-slate-400 text-center">
              Click any button above to auto-fill verified demonstration credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
