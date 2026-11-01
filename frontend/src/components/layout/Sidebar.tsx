import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Search,
  CalendarCheck,
  Car,
  Clock,
  CreditCard,
  MessageSquareWarning,
  Building2,
  Layers,
  CircleDollarSign,
  Users,
  BarChart3,
  History,
  LogIn,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, isAdmin, isStaff, isCustomer } = useAuth();
  const navigate = useNavigate();

  const customerNav = [
    { to: '/customer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/customer/find-parking', label: 'Find Parking', icon: Search },
    { to: '/customer/reservations', label: 'My Reservations', icon: CalendarCheck },
    { to: '/customer/vehicles', label: 'My Vehicles', icon: Car },
    { to: '/customer/sessions', label: 'Parking Sessions', icon: Clock },
    { to: '/customer/payments', label: 'Payment Receipts', icon: CreditCard },
    { to: '/customer/complaints', label: 'Support & Feedback', icon: MessageSquareWarning },
  ];

  const staffNav = [
    { to: '/staff/dashboard', label: 'Staff Overview', icon: LayoutDashboard },
    { to: '/staff/check-in', label: 'Entry Verification', icon: LogIn },
    { to: '/staff/check-out', label: 'Exit Processing', icon: LogOut },
    { to: '/staff/active-sessions', label: 'Active Sessions', icon: Clock },
    { to: '/staff/complaints', label: 'Issue Management', icon: MessageSquareWarning },
  ];

  const adminNav = [
    { to: '/admin/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { to: '/admin/facilities', label: 'Facilities & Zones', icon: Building2 },
    { to: '/admin/slots', label: 'Slot Configuration', icon: Layers },
    { to: '/admin/pricing', label: 'Pricing Rules', icon: CircleDollarSign },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/reservations', label: 'All Reservations', icon: CalendarCheck },
    { to: '/admin/payments', label: 'Transactions', icon: CreditCard },
    { to: '/admin/complaints', label: 'Complaint Tickets', icon: MessageSquareWarning },
    { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/admin/audit-logs', label: 'Audit Trail', icon: History },
  ];

  const navItems = isAdmin ? adminNav : isStaff ? staffNav : customerNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-900 text-slate-300 z-50 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-900/40 font-extrabold text-sm tracking-wider">
              PN
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">ParkNexus</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-950 text-blue-400 border border-blue-800">
                ENTERPRISE
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {isAdmin ? 'Admin Console' : isStaff ? 'Staff Portal' : 'Customer Workspace'}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer Role Card & Sign out */}
        <div className="p-3 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3 text-xs flex items-center justify-between">
            <div className="truncate mr-2">
              <p className="font-semibold text-white truncate">{user?.full_name}</p>
              <p className="text-slate-400 truncate text-[11px]">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-md transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
