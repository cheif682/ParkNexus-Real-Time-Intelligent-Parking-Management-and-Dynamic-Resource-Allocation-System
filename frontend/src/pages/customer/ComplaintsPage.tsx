import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Complaint, ComplaintCategory } from '../../types';
import { MessageSquareWarning, Plus, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react';

export const ComplaintsPage: React.FC = () => {
  const { success, error } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // New ticket modal
  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState<ComplaintCategory>('SLOT_ALLOCATION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Expanded ticket details
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await api.getComplaints();
      setComplaints(data || []);
    } catch (e: any) {
      error(e.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    try {
      setSubmitting(true);
      const c = await api.submitComplaint({
        category,
        title: title.trim(),
        description: description.trim(),
      });
      success(`Ticket ${c.ticket_number} created successfully.`);
      setShowModal(false);
      setTitle('');
      setDescription('');
      loadComplaints();
    } catch (err: any) {
      error(err.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Support & Complaints</h2>
          <p className="text-xs text-slate-500 mt-1">
            Submit issues regarding slot allocation, gate barrier entry/exit, or payment queries
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading tickets...</div>
        ) : complaints.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No complaints submitted. Everything is running smoothly!
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedTicket(c)}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-800">{c.ticket_number}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 uppercase">
                      {c.category.replace('_', ' ')}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'OPEN'
                          ? 'bg-blue-50 text-blue-700'
                          : c.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-700'
                          : c.status === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mt-1">{c.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{c.description}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] text-slate-400 block font-mono">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  {c.resolution_notes && (
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      ✓ Resolution note available
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono font-bold text-xs text-blue-600">{selectedTicket.ticket_number}</span>
                <h3 className="font-bold text-base text-slate-900">{selectedTicket.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Description</span>
                <p className="text-slate-700 mt-1">{selectedTicket.description}</p>
              </div>

              {selectedTicket.resolution_notes && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-emerald-700 block text-[10px] uppercase font-bold">Staff Resolution Notes</span>
                  <p className="text-emerald-950 mt-1 font-medium">{selectedTicket.resolution_notes}</p>
                </div>
              )}

              {/* Updates timeline */}
              {selectedTicket.updates && selectedTicket.updates.length > 0 && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-2">History & Updates</span>
                  <div className="space-y-2 border-l-2 border-slate-200 pl-3">
                    {selectedTicket.updates.map((u) => (
                      <div key={u.id} className="text-xs">
                        <span className="font-bold text-slate-800">{u.author_name || 'Staff'}:</span>{' '}
                        <span className="text-slate-600">{u.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Create Support Ticket</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="SLOT_ALLOCATION">Slot Allocation / Indicator Issue</option>
                  <option value="PAYMENT">Payment / Billing Discrepancy</option>
                  <option value="VEHICLE_ENTRY_EXIT">Vehicle Gate Entry / Exit Barrier</option>
                  <option value="FACILITY">Facility Maintenance / Cleanliness</option>
                  <option value="OTHER">Other General Query</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Subject *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. EV charger connector not releasing"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide specific details, slot number or booking reference..."
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
                  {submitting ? 'Submitting...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
