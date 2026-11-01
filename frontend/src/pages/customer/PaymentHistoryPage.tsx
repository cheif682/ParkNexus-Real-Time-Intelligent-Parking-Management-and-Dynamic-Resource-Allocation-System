import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Payment } from '../../types';
import { CreditCard, Printer, CheckCircle2, Search, X, FileText } from 'lucide-react';

export const PaymentHistoryPage: React.FC = () => {
  const { error } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await api.getPayments();
      setPayments(data || []);
    } catch (e: any) {
      error(e.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Receipts</h2>
        <p className="text-xs text-slate-500 mt-1">
          Review your processed transactions, payment methods, and download official tax receipts
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading transactions...</div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No payment transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Transaction Reference</th>
                  <th className="py-2.5 px-3">Booking Ref</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{p.transaction_reference}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{p.booking_reference || 'N/A'}</td>
                    <td className="py-3 px-3">{new Date(p.created_at).toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-700 uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                        {p.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 text-sm">₹{p.amount}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedReceipt(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs transition"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  PN
                </div>
                <span className="font-bold text-slate-900 text-sm">ParkNexus Official Receipt</span>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Transaction ID</span>
                <span className="font-mono font-bold text-slate-800">{selectedReceipt.transaction_reference}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Customer Name</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.user_name || 'Customer'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Booking Reference</span>
                <span className="font-mono text-slate-800">{selectedReceipt.booking_reference || 'Exit Payment'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Payment Channel</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.payment_method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Date & Timestamp</span>
                <span className="text-slate-700">{new Date(selectedReceipt.created_at).toLocaleString()}</span>
              </div>

              <div className="pt-2 flex justify-between items-center text-base">
                <span className="font-bold text-slate-900">Total Amount Paid</span>
                <span className="font-black text-blue-600">₹{selectedReceipt.amount} {selectedReceipt.currency}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
