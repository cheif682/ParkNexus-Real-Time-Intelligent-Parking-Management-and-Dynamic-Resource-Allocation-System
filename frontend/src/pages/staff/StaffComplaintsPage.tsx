import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Complaint, ComplaintStatus } from '../../types';
import { MessageSquareWarning, CheckCircle2, Clock, X, Edit3 } from 'lucide-react';

export const StaffComplaintsPage: React.FC = () => {
  const { success, error } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Resolution modal
  const [activeTicket, setActiveTicket] = useState<Complaint | null>(null);
  const [status, setStatus] = useState<ComplaintStatus>('IN_PROGRESS');
  const [note, setNote] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await api.getComplaints();
      setComplaints(data || []);
    } catch (e: any) {
      error(e.message || 'Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;

    try {
      setUpdating(true);
      await api.updateComplaintStatus(activeTicket.id, {
        status,
        note: note.trim() || undefined,
        resolution_notes: resolutionNotes.trim() || undefined,
      });

      success(`Ticket ${activeTicket.ticket_number} updated to ${status}.`);
      setActiveTicket(null);
      setNote('');
      setResolutionNotes('');
      loadComplaints();
    } catch (err: any) {
      error(err.message || 'Failed to update ticket');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Facility Issue Management</h2>
        <p className="text-xs text-slate-500 mt-1">Review customer reports, update maintenance notes and resolve gate barrier queries</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading issues...</div>
        ) : complaints.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No issues reported.</div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900">{c.ticket_number}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                      {c.category.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'OPEN'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : c.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : c.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mt-1">{c.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{c.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Reported by: <span className="font-semibold text-slate-700">{c.user_name}</span> ({c.user_email})
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      setActiveTicket(c);
                      setStatus(c.status);
                      setResolutionNotes(c.resolution_notes || '');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Update Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Modal */}
      {activeTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{activeTicket.ticket_number}</span>
                <h3 className="font-bold text-base text-slate-900">Update Ticket Status</h3>
              </div>
              <button onClick={() => setActiveTicket(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Transition</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-semibold"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Staff dispatched)</option>
                  <option value="RESOLVED">RESOLVED (Action completed)</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Inspected charger connector, verified latch functioning..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Progress Update Note (Optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Technician dispatched on site"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
