/**
 * Floating AI Provider Copilot Chatbot
 * Path: src/modules/provider/components/ProviderAIChatBot.jsx
 * 
 * Specifically designed for Service Provider & Technician Portal with trained AI operations:
 * - Real-time inspection of incoming customer requests
 * - Direct 1-click job acceptance inside chat
 * - Financial statement & earnings analysis
 * - Daily schedule and appointment management
 * - Marketplace hourly rate benchmarks
 * - Emergency dispatch checklist and customer satisfaction coaching
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  Send,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Star,
  Check,
  Zap,
} from 'lucide-react';
import api from '../../../services/api';
import { generateProviderAIResponse } from '../../../services/providerAIService';
import dataStore, { playChimeSound } from '../../../services/dataStore';

const STORAGE_KEY_PROVIDER_CHAT = 'handypro_provider_chat_history_v2';

export default function ProviderAIChatBot() {
  const navigate = useNavigate();

  // Load live provider profile & bookings
  const [profile, setProfile] = useState(() => dataStore.getProviderProfile());
  const [allBookings, setAllBookings] = useState(() => dataStore.getBookings());

  const activeProviderId = profile?.id || 'prov-active';
  const activeProviderName = profile?.name || 'Service Provider';

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState('');

  // Subscribe to live data changes
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setProfile(dataStore.getProviderProfile());
      setAllBookings(dataStore.getBookings());
    });
    return unsubscribe;
  }, []);

  const earningsAnalytics = dataStore.getProviderEarningsAnalytics(activeProviderId, activeProviderName);

  // Filter provider's pending requests
  const pendingRequests = allBookings.filter(
    (b) => b.status === 'PENDING' && dataStore.isBookingForProvider(b, activeProviderId, activeProviderName)
  );

  // Initial greeting
  const initialGreeting = {
    id: 'prov-welcome-1',
    sender: 'ai',
    text: `Hi **${activeProviderName.split(' ')[0]}**! 👋 I'm your **HandyPro Provider Copilot**.\n\nYou currently have **${pendingRequests.length} pending customer request(s)** and **$${earningsAnalytics.totalEarnings.toFixed(2)}** in total lifetime earnings. How can I assist you with your schedule, jobs, or pricing today?`,
    suggestions: [
      '📋 Review Pending Requests',
      '💰 Earnings Breakdown',
      '📅 Today Schedule',
      '📈 Rate Benchmark',
    ],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_PROVIDER_CHAT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // Fallback
    }
    return [initialGreeting];
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_PROVIDER_CHAT, JSON.stringify(messages));
    } catch (e) {
      // Storage quota safety
    }
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      setShowTeaser(false);
    }
  }, [isOpen, isMinimized]);

  // Handle Send Message
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      // 1. Attempt Backend AI Copilot Gateway (Gemini + Real DB Analytics)
      if (text.toLowerCase().includes('copilot') || text.toLowerCase().includes('insight') || text.toLowerCase().includes('rate') || text.toLowerCase().includes('advice') || text.toLowerCase().includes('earn')) {
        const res = await api.post('/ai/copilot-insights', {
          providerId: activeProviderId,
          providerName: activeProviderName,
          category: profile.category || 'plumbing',
          question: text,
        });

        if (res.data && res.data.success && res.data.data?.aiInsightText) {
          const aiMsg = {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: res.data.data.aiInsightText,
            suggestions: ['📋 Review Requests', '💰 Payout Breakdown', '⭐ Boost Rating'],
            sourceBadge: 'Gemini Copilot Engine',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
          if (isSoundEnabled) playChimeSound();
          return;
        }
      }
    } catch (e) {
      // Fall through
    }

    // 2. Intelligent Provider Domain Engine Fallback
    setTimeout(() => {
      const aiReply = generateProviderAIResponse({
        userMessage: text,
        providerProfile: profile,
        allBookings,
        earningsAnalytics,
      });

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply.text,
        cardType: aiReply.cardType,
        cards: aiReply.cards,
        actionButton: aiReply.actionButton,
        suggestions: aiReply.suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);

      if (isSoundEnabled) {
        playChimeSound();
      }
    }, 450);
  };

  // Direct 1-Click Accept Request from Chat
  const handleAcceptJobFromChat = (bookingId) => {
    dataStore.updateBookingStatus(bookingId, 'ACCEPTED');
    playChimeSound();

    setActionSuccessNotice(`Job ${bookingId} accepted successfully!`);
    setTimeout(() => setActionSuccessNotice(''), 3500);

    // Add confirmation message to chat
    const confirmMsg = {
      id: `ai-confirm-${Date.now()}`,
      sender: 'ai',
      text: `✅ **Job ${bookingId} has been confirmed & added to your active schedule!**\n\nThe customer has been notified with your arrival details. Would you like to view your updated schedule?`,
      actionButton: {
        label: '📅 Open Schedule',
        action: 'NAVIGATE_PAGE',
        path: '/provider/schedule',
      },
      suggestions: ['📅 Today Schedule', '💰 Updated Earnings', '📋 Other Requests'],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, confirmMsg]);
  };

  const handleClearHistory = () => {
    setMessages([initialGreeting]);
    sessionStorage.removeItem(STORAGE_KEY_PROVIDER_CHAT);
  };

  const handleAction = (btn) => {
    if (!btn) return;
    if (btn.action === 'NAVIGATE_PAGE') {
      navigate(btn.path);
      setIsOpen(false);
    } else if (btn.action === 'NAVIGATE_TAB') {
      navigate('/provider/dashboard');
      setIsOpen(false);
    }
  };

  // Safely render formatted bold text and bullets
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');

    return (
      <div className="space-y-1 text-xs sm:text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          const parts = line.split(/(\*\*.*?\*\*)/g);
          const renderedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-extrabold text-slate-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('*') && part.endsWith('*')) {
              return (
                <em key={pIdx} className="italic text-slate-700">
                  {part.slice(1, -1)}
                </em>
              );
            }
            return part;
          });

          return (
            <p key={idx} className="text-slate-800">
              {renderedLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 font-sans">
      {/* TEASER BUBBLE */}
      {!isOpen && showTeaser && (
        <div className="absolute bottom-16 right-0 mb-2 w-72 sm:w-80 rounded-2xl bg-white p-3.5 shadow-2xl border border-emerald-100 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">
                Provider Copilot
              </span>
              <button
                onClick={() => setShowTeaser(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              {pendingRequests.length > 0
                ? `You have ${pendingRequests.length} pending request(s) waiting for your response!`
                : 'Need assistance reviewing today’s jobs or benchmark rates?'}
            </p>
            <button
              onClick={() => {
                setIsOpen(true);
                setShowTeaser(false);
              }}
              className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
            >
              Open Pro Copilot <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setShowTeaser(false);
          }}
          aria-label="Open HandyPro Provider Copilot"
          className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-4 py-3 sm:px-5 sm:py-3.5 text-white shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/40 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400 border border-white"></span>
          </span>
          <Briefcase className="h-5 w-5 text-emerald-100" />
          <span className="font-extrabold text-sm tracking-wide">Pro Copilot</span>
          {pendingRequests.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[11px] font-black">
              {pendingRequests.length}
            </span>
          )}
        </button>
      )}

      {/* EXPANDED CHAT WINDOW */}
      {isOpen && (
        <div
          className={`flex flex-col rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden transition-all duration-200 ${
            isMinimized
              ? 'w-72 sm:w-80 h-16'
              : 'w-[calc(100vw-2.5rem)] sm:w-[410px] h-[580px] max-h-[85vh]'
          }`}
        >
          {/* CHAT HEADER */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-3.5 sm:p-4 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
                  <Sparkles className="h-5 w-5 text-amber-300" />
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-emerald-800"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-wide">Provider Copilot</h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/40 border border-emerald-300/30 text-[10px] font-bold text-emerald-100">
                    Trained AI
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 font-medium">
                  {activeProviderName} • Live Dispatch
                </p>
              </div>
            </div>

            {/* Header Action Icons */}
            <div className="flex items-center gap-1 text-emerald-100">
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                title={isSoundEnabled ? 'Mute audio' : 'Unmute audio'}
                className="p-1.5 rounded-xl hover:bg-white/10 transition"
              >
                {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-300" />}
              </button>

              <button
                onClick={handleClearHistory}
                title="Restart chat"
                className="p-1.5 rounded-xl hover:bg-white/10 transition"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Expand' : 'Minimize'}
                className="p-1.5 rounded-xl hover:bg-white/10 transition"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close Copilot"
                className="p-1.5 rounded-xl hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* MAIN CHAT CONTENT */}
          {!isMinimized && (
            <>
              {/* SUCCESS NOTICE TOAST */}
              {actionSuccessNotice && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccessNotice}</span>
                </div>
              )}

              {/* QUICK PROMPT CHIPS */}
              <div className="bg-slate-50 border-b border-slate-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">Quick:</span>
                {[
                  { label: '📋 Pending Jobs', query: 'Show my pending customer requests' },
                  { label: '💰 Earnings', query: 'What are my total earnings and pending payouts?' },
                  { label: '📅 Schedule', query: 'What jobs do I have on my schedule?' },
                  { label: '⚡ Emergency', query: 'Emergency job dispatch checklist and tools' },
                  { label: '📈 Benchmark', query: 'How does my hourly rate compare to the market?' },
                  { label: '⭐ Rating Tips', query: 'How can I get more 5 star customer reviews?' },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.query)}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 text-[11px] font-bold border border-slate-200 transition shadow-2xs"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* MESSAGES LIST */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/60">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-end gap-2 max-w-[92%]">
                      {msg.sender === 'ai' && (
                        <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs mb-1">
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>
                      )}

                      <div
                        className={`rounded-2xl p-3.5 shadow-xs ${
                          msg.sender === 'user'
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                        }`}
                      >
                        {msg.sender === 'user' ? (
                          <p className="text-xs sm:text-sm font-medium leading-relaxed">{msg.text}</p>
                        ) : (
                          renderFormattedText(msg.text)
                        )}

                        {/* EMBEDDED JOB REQUEST CARDS (With 1-click Accept) */}
                        {msg.cards && msg.cardType === 'job_requests' && (
                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
                            {msg.cards.map((j) => (
                              <div
                                key={j.id}
                                className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 hover:border-emerald-300 transition space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-extrabold text-[11px] text-emerald-700">{j.id}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                      j.isEmergency
                                        ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {j.isEmergency ? '🚨 24/7 Emergency' : j.status}
                                  </span>
                                </div>

                                <p className="font-extrabold text-xs text-slate-900">{j.serviceTitle}</p>

                                <div className="text-[11px] text-slate-600 space-y-0.5">
                                  <p className="flex items-center justify-between">
                                    <span>Customer: <strong>{j.customerName}</strong></span>
                                    <span className="font-black text-emerald-600 text-xs">${j.amount}</span>
                                  </p>
                                  <p className="flex items-center gap-1 text-slate-500 text-[10px]">
                                    <Clock className="h-3 w-3" />
                                    <span>{j.scheduledDate} at {j.scheduledTime}</span>
                                  </p>
                                  <p className="flex items-center gap-1 text-slate-500 text-[10px]">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{j.customerAddress || j.customerLocation}</span>
                                  </p>
                                </div>

                                {j.status === 'PENDING' && (
                                  <div className="pt-1.5 flex items-center gap-2">
                                    <button
                                      onClick={() => handleAcceptJobFromChat(j.id)}
                                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-xs transition flex items-center justify-center gap-1"
                                    >
                                      <Check className="h-3 w-3" />
                                      <span>Accept Request (${j.amount})</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* EMBEDDED SCHEDULE CARDS */}
                        {msg.cards && msg.cardType === 'schedule_list' && (
                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
                            {msg.cards.map((s) => (
                              <div
                                key={s.id}
                                className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-xs space-y-1"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-emerald-700 text-[11px]">{s.id}</span>
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    Confirmed
                                  </span>
                                </div>
                                <p className="font-bold text-slate-900 text-xs">{s.serviceTitle}</p>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>{s.scheduledDate} • {s.scheduledTime}</span>
                                  <span className="font-black text-emerald-600">${s.amount}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ACTION BUTTON */}
                        {msg.actionButton && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleAction(msg.actionButton)}
                              className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                            >
                              <span>{msg.actionButton.label}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {msg.timestamp}
                    </span>

                    {/* AI SUGGESTION PILLS */}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                        {msg.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => handleSendMessage(sug)}
                            className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-[11px] font-bold border border-slate-200 transition shadow-2xs"
                          >
                            💬 {sug}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* TYPING INDICATOR */}
                {isTyping && (
                  <div className="flex items-end gap-2">
                    <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs mb-1">
                      <Sparkles className="h-3.5 w-3.5 animate-spin-slow" />
                    </div>
                    <div className="rounded-2xl rounded-bl-xs bg-white border border-slate-200 px-4 py-3 shadow-xs flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* INPUT BAR */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ask Pro Copilot (e.g. Pending requests, earnings)..."
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:border-emerald-600 focus:outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>Trained on provider jobs, rates & schedule</span>
                  <span>Press Enter to send</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
