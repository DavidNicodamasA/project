/**
 * Digital Service Warranty Certificate Component
 * Path: src/modules/user/components/DigitalWarrantyCertificate.jsx
 */

import React, { useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  Calendar,
  Printer,
  Download,
  X,
  Wrench,
  AlertTriangle,
  Award,
} from 'lucide-react';
import axios from 'axios';

export default function DigitalWarrantyCertificate({ warranty, onClose, onClaimSuccess }) {
  const certificateRef = useRef(null);

  if (!warranty) return null;

  const isExpired = new Date(warranty.expiryDate) < new Date();
  const daysLeft = Math.max(0, Math.ceil((new Date(warranty.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)));

  const handlePrint = () => {
    window.print();
  };

  const handleClaimRevisit = async () => {
    const reason = prompt('Please describe why you are requesting a warranty revisit:');
    if (!reason) return;

    try {
      const res = await axios.post(`/api/v1/warranties/${warranty.warrantyId}/claim`, {
        issueNotes: reason,
      });

      if (res.data?.success) {
        alert('Warranty claim approved! A complimentary technician revisit booking has been created in your appointments.');
        if (onClaimSuccess) onClaimSuccess(res.data.data);
        if (onClose) onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to file warranty claim.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:rounded-none">
        {/* Certificate Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
            <Award className="h-5 w-5 text-blue-600" />
            <span>Official HandyPro Digital Service Warranty</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="rounded-xl border border-slate-300 hover:bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE CERTIFICATE BODY */}
        <div ref={certificateRef} className="p-8 sm:p-10 space-y-6 overflow-y-auto print:p-6 print:overflow-visible bg-gradient-to-b from-blue-50/20 via-white to-slate-50/40 border-8 border-double border-blue-900/10 m-3 rounded-2xl">
          {/* Certificate Header Emblem */}
          <div className="text-center space-y-2 border-b-2 border-slate-200 pb-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/20">
              <ShieldCheck className="h-9 w-9" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Certificate of Service Warranty
            </h2>
            <p className="text-xs font-semibold text-slate-500">
              Issued under HandyPro Quality & Workmanship Protection Guarantee
            </p>
            <div className="inline-block rounded-full bg-blue-100 border border-blue-300 px-4 py-1 text-xs font-black text-blue-800 tracking-wider">
              WARRANTY ID: {warranty.warrantyId}
            </div>
          </div>

          {/* Certificate Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer Name</span>
              <span className="text-sm font-extrabold text-slate-900">{warranty.customerName}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Booking ID: {warranty.bookingId}</span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Certified Technician</span>
              <span className="text-sm font-extrabold text-slate-900">{warranty.providerName}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">Category: {warranty.serviceCategory?.toUpperCase()}</span>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Performed</span>
              <span className="text-xs font-extrabold text-slate-900 block truncate">{warranty.serviceTitle}</span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Completed: {new Date(warranty.completionDate || warranty.startDate).toLocaleDateString()}
              </span>
            </div>

            <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Coverage Duration</span>
              <span className="text-sm font-black text-emerald-900">
                {warranty.durationDays} Days ({daysLeft} days active)
              </span>
              <span className="text-[11px] text-emerald-700 block mt-0.5">
                Expires: {new Date(warranty.expiryDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Coverage Terms & Guarantee */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
            <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span>Coverage Specifications & Terms:</span>
            </h4>
            <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5 font-medium">
              {warranty.terms?.map((term, idx) => (
                <li key={idx}>{term}</li>
              ))}
            </ul>
          </div>

          {/* Security Verification Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-[11px] text-slate-400">
            <div>
              <span>Verified Authentic Digital Certificate</span>
              <span className="block text-[10px]">HandyPro Platform Security Protocol</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-700">HandyPro Technologies Inc.</span>
              <span className="block text-[10px]">Authorized Quality Stamp</span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-200 px-6 py-4 bg-white gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                isExpired ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isExpired ? 'Warranty Expired' : `Active Coverage (${daysLeft} Days Left)`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isExpired && (
              <button
                type="button"
                onClick={handleClaimRevisit}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Claim Free Revisit ($0)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

