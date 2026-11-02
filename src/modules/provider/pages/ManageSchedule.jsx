/**
 * Manage Provider Working Schedule
 * Path: src/modules/provider/pages/ManageSchedule.jsx
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/layout/Navbar';
import dataStore from '../../../services/dataStore';
import {
  Clock,
  Calendar,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Save,
  ShieldCheck,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TIME_SLOTS = [
  '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM',
  '07:00 PM', '08:00 PM', '09:00 PM',
];

export default function ManageSchedule() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => dataStore.getProviderProfile());
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Weekly Schedule State
  const [schedule, setSchedule] = useState({
    Monday: { enabled: true, startTime: '08:00 AM', endTime: '06:00 PM' },
    Tuesday: { enabled: true, startTime: '08:00 AM', endTime: '06:00 PM' },
    Wednesday: { enabled: true, startTime: '08:00 AM', endTime: '06:00 PM' },
    Thursday: { enabled: true, startTime: '08:00 AM', endTime: '06:00 PM' },
    Friday: { enabled: true, startTime: '08:00 AM', endTime: '06:00 PM' },
    Saturday: { enabled: true, startTime: '09:00 AM', endTime: '04:00 PM' },
    Sunday: { enabled: false, startTime: '10:00 AM', endTime: '02:00 PM' },
  });

  const [allowEmergencySlots, setAllowEmergencySlots] = useState(profile.supportsEmergency ?? true);

  const handleToggleDay = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSaveSchedule = () => {
    setIsSaving(true);
    const updated = dataStore.updateProviderProfile({
      supportsEmergency: allowEmergencySlots,
      workingHours: `Mon - Sat (08:00 AM - 06:00 PM)`,
    });
    setProfile(updated);
    setIsSaving(false);
    setMessage('Schedule and working hours saved successfully to store!');
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* Header Title & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              Station Availability Manager
            </span>
            <h1 className="text-2xl font-black text-slate-900 mt-1 font-display">Manage Working Schedule</h1>
            <p className="text-xs text-slate-500 font-medium">
              Configure your weekly availability hours for customer booking appointments
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/provider/dashboard')}
            className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition shadow-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div className="p-3.5 rounded-2xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-between shadow-xs">
            <span>{message}</span>
            <button
              type="button"
              onClick={() => setMessage('')}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Emergency Overtime Toggle Card */}
        <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-red-600 fill-red-600" />
              <h2 className="text-base font-black text-slate-900 font-display">24/7 Emergency SOS Service Slots</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Allow urgent high-priority requests outside regular working hours with +$25 surcharge
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAllowEmergencySlots(!allowEmergencySlots)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition border flex items-center gap-2 ${
              allowEmergencySlots
                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {allowEmergencySlots ? '✓ Emergency Mode Active' : 'Off'}
          </button>
        </div>

        {/* Weekly Hours Settings */}
        <div className="rounded-3xl bg-white p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-black text-slate-900 font-display">Weekly Availability Schedule</h2>
            <p className="text-xs text-slate-500 font-medium">
              Toggle working days and set start and end hours for customer appointments
            </p>
          </div>

          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day) => {
              const dayConfig = schedule[day] || { enabled: false, startTime: '09:00 AM', endTime: '05:00 PM' };

              return (
                <div
                  key={day}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    dayConfig.enabled
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50/70 border-slate-200 opacity-60'
                  }`}
                >
                  {/* Day Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        dayConfig.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          dayConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="font-extrabold text-sm text-slate-900 min-w-[90px] font-display">{day}</span>
                  </div>

                  {/* Time Pickers */}
                  {dayConfig.enabled ? (
                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <select
                        value={dayConfig.startTime}
                        onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>

                      <span className="text-xs font-bold text-slate-400">to</span>

                      <select
                        value={dayConfig.endTime}
                        onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                        className="rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                      >
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-400 italic">Off / Unavailable</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save Action */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveSchedule}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition active:scale-[0.99] flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Schedule Settings'}</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}