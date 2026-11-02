/**
 * Floating AI Customer Assistant Chatbot
 * Path: src/modules/user/components/CustomerAIChatBot.jsx
 * 
 * Specifically designed for Customer Dashboard with trained AI domain capabilities:
 * - Direct 1-click booking integration from chat suggestions
 * - Real-time provider recommendations based on live online technicians
 * - Appointment tracking and status inspection
 * - Transparent pricing guide & invoices summary
 * - Emergency safety guidance & fast-track dispatch
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  Send,
  RotateCcw,
  Volume2,
  VolumeX,
  Star,
  Clock,
  ShieldCheck,
  Zap,
  Calendar,
  Compass,
  Receipt,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import api from '../../../services/api';
import { generateAIResponse } from '../../../services/customerAIService';
import { playChimeSound } from '../../../services/dataStore';

const STORAGE_KEY_CHAT = 'handypro_customer_chat_history_v2';

export default function CustomerAIChatBot({
  activeCustomerName = 'Customer',
  customerProfile = {},
  currentLocation = 'Downtown / Central',
  providers = [],
  myBookings = [],
  invoiceData = { totalSpent: 0, invoices: [] },
  onOpenBookingModal,
  onSwitchTab,
  onSelectCategory,
  onSearchQuery,
}) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTeaser, setShowTeaser] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Initialize initial greetings message
  const initialGreeting = {
    id: 'welcome-1',
    sender: 'ai',
    text: `Hi **${activeCustomerName.split(' ')[0]}**! 👋 I'm **HandyAI**, your dedicated Customer Assistant trained on the HandyPro platform.\n\nI can recommend top-rated technicians near **${currentLocation}**, track your appointments, check repair rates, or assist with 24/7 emergencies. What can I do for you today?`,
    suggestions: ['⚡ Emergency Plumber', '📦 Track My Bookings', '⚡ Electrician Near Me', '💰 Hourly Rates'],
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_CHAT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // Fallback to initial
    }
    return [initialGreeting];
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Persist messages in session
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY_CHAT, JSON.stringify(messages));
    } catch (e) {
      // Storage quota safety
    }
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto focus input when chat opens
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
      // 1. Attempt Backend AI Gateway with Gemini Integration & Database Context
      const res = await api.post('/ai/chat', {
        message: text,
        customerName: activeCustomerName,
        currentLocation,
        customerProfile,
        customerId: customerProfile?.id || 'cust-user',
      });

      if (res.data && res.data.success) {
        const aiData = res.data;
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: aiData.text,
          cardType: aiData.recommendedProviders?.length ? 'provider_list' : undefined,
          cards: aiData.recommendedProviders,
          actionButton: aiData.actionButton,
          suggestions: aiData.suggestions,
          sourceBadge: aiData.source || 'Gemini 1.5 Flash LLM',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
        if (isSoundEnabled) playChimeSound();
        return;
      }
    } catch (err) {
      // Fallback
    }

    // 2. Local Domain Engine Fallback
    setTimeout(() => {
      const aiReply = generateAIResponse({
        userMessage: text,
        customerName: activeCustomerName,
        customerProfile,
        currentLocation,
        providers,
        myBookings,
        invoiceData,
      });

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply.text,
        cardType: aiReply.cardType,
        cards: aiReply.cards,
        actionButton: aiReply.actionButton,
        suggestions: aiReply.suggestions,
        sourceBadge: 'HandyPro AI Domain Model',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);

      if (isSoundEnabled) {
        playChimeSound();
      }
    }, 450);
  };

  const handleClearHistory = () => {
    setMessages([initialGreeting]);
    sessionStorage.removeItem(STORAGE_KEY_CHAT);
  };

  const handleAction = (btn) => {
    if (!btn) return;
    if (btn.action === 'SWITCH_TAB' && onSwitchTab) {
      onSwitchTab(btn.tab);
      setIsOpen(false);
    } else if (btn.action === 'OPEN_EMERGENCY_MODAL' || btn.action === 'BOOK_PROVIDER') {
      if (onOpenBookingModal && btn.provider) {
        onOpenBookingModal(btn.provider);
        setIsOpen(false);
      }
    } else if (btn.action === 'FILTER_CATEGORY' && onSelectCategory) {
      onSelectCategory(btn.category);
      if (onSwitchTab) onSwitchTab('browse');
      setIsOpen(false);
    } else if (btn.action === 'RESET_SEARCH') {
      if (onSelectCategory) onSelectCategory('all');
      if (onSearchQuery) onSearchQuery('');
      if (onSwitchTab) onSwitchTab('browse');
      setIsOpen(false);
    }
  };

  // Render markdown-like bold and bullet formatting safely
  const renderFormattedText = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');

    return (
      <div className="space-y-1 text-xs sm:text-[13px] leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Format bold **text**
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
      {/* TEASER BUBBLE (Displayed when closed to welcome user) */}
      {!isOpen && showTeaser && (
        <div className="absolute bottom-16 right-0 mb-2 w-72 sm:w-80 rounded-2xl bg-white p-3.5 shadow-2xl border border-blue-100 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Sparkles className="h-4 w-4 animate-spin-slow" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">HandyAI Online</span>
              <button
                onClick={() => setShowTeaser(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              Need help finding a technician or tracking your appointments?
            </p>
            <button
              onClick={() => {
                setIsOpen(true);
                setShowTeaser(false);
              }}
              className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Ask AI Assistant <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING TRIGGER BUTTON (When closed) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setShowTeaser(false);
          }}
          aria-label="Open HandyAI Customer Assistant"
          className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-4 py-3 sm:px-5 sm:py-3.5 text-white shadow-xl shadow-blue-600/30 hover:shadow-2xl hover:shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border border-white"></span>
          </span>
          <Sparkles className="h-5 w-5 text-amber-300" />
          <span className="font-extrabold text-sm tracking-wide">Ask HandyAI</span>
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
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-3.5 sm:p-4 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner">
                  <Sparkles className="h-5 w-5 text-amber-300" />
                </div>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-blue-800"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-wide">HandyAI Assistant</h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-500/40 border border-blue-300/30 text-[10px] font-bold text-blue-100">
                    Trained
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 font-medium flex items-center gap-1">
                  <span>Customer Support • Live portal data</span>
                </p>
              </div>
            </div>

            {/* Header Action Icons */}
            <div className="flex items-center gap-1 text-blue-100">
              <button
                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                title={isSoundEnabled ? 'Mute audio cues' : 'Enable audio cues'}
                className="p-1.5 rounded-xl hover:bg-white/10 transition"
              >
                {isSoundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-300" />}
              </button>

              <button
                onClick={handleClearHistory}
                title="Restart & clear conversation"
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
                title="Close AI Assistant"
                className="p-1.5 rounded-xl hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* MAIN CHAT CONTENT (Hidden if minimized) */}
          {!isMinimized && (
            <>
              {/* QUICK PROMPT CHIPS */}
              <div className="bg-slate-50 border-b border-slate-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">Quick:</span>
                {[
                  { label: '⚡ Emergency', query: 'I have an urgent emergency water leak' },
                  { label: '📦 My Bookings', query: 'Show my booking appointment status' },
                  { label: '🔧 Best Plumber', query: 'Who is the highest rated plumber?' },
                  { label: '⚡ Electricians', query: 'Find me a certified electrician' },
                  { label: '💰 Pricing', query: 'What are the hourly rates for services?' },
                  { label: '🧾 Invoices', query: 'How much have I spent on services?' },
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.query)}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-bold border border-slate-200 transition shadow-2xs"
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
                        <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs mb-1">
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>
                      )}

                      <div
                        className={`rounded-2xl p-3.5 shadow-xs ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                        }`}
                      >
                        {msg.sender === 'user' ? (
                          <p className="text-xs sm:text-sm font-medium leading-relaxed">{msg.text}</p>
                        ) : (
                          renderFormattedText(msg.text)
                        )}

                        {/* EMBEDDED PROVIDER CARDS (When AI suggests providers) */}
                        {msg.cards && msg.cardType === 'provider_list' && (
                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
                            {msg.cards.map((p) => (
                              <div
                                key={p.id}
                                className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 hover:border-blue-300 transition"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-8 w-8 rounded-lg ${p.avatarBg || 'bg-blue-600'} text-white flex items-center justify-center font-black text-xs`}
                                    >
                                      {p.name.charAt(0)}
                                    </div>
                                    <div>
                                      <h4 className="font-extrabold text-xs text-slate-900">{p.name}</h4>
                                      <p className="text-[10px] text-blue-600 font-bold">{p.categoryLabel} Specialist</p>
                                    </div>
                                  </div>
                                  <span className="font-black text-xs text-emerald-600">${p.hourlyRate}/hr</span>
                                </div>

                                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                                    ★ {p.rating} ({p.reviewsCount})
                                  </span>
                                  <span>~{(p.calculatedDistanceMiles || 1.5).toFixed(1)} km away</span>
                                </div>

                                <div className="mt-2.5 flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (onOpenBookingModal) onOpenBookingModal(p);
                                      setIsOpen(false);
                                    }}
                                    className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] shadow-xs transition"
                                  >
                                    ⚡ Book Now
                                  </button>
                                  <button
                                    onClick={() => {
                                      navigate(`/user/provider/${p.id}`);
                                      setIsOpen(false);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 font-bold text-[11px] transition"
                                  >
                                    Profile
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* EMBEDDED BOOKING CARDS (When AI returns booking list) */}
                        {msg.cards && msg.cardType === 'booking_list' && (
                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-2.5">
                            {msg.cards.map((b) => (
                              <div
                                key={b.id}
                                className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-blue-700 text-[11px]">{b.id}</span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                      b.status === 'ACCEPTED'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : b.status === 'PENDING'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    {b.status}
                                  </span>
                                </div>
                                <p className="font-bold text-slate-800 text-xs">{b.serviceTitle}</p>
                                <div className="flex items-center justify-between text-[11px] text-slate-500">
                                  <span>Tech: {b.providerName}</span>
                                  <span>${b.amount}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {b.scheduledDate} at {b.scheduledTime}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ACTION BUTTON (e.g. Switch to tab or emergency dispatch) */}
                        {msg.actionButton && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => handleAction(msg.actionButton)}
                              className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
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
                            className="px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-[11px] font-bold border border-slate-200 transition shadow-2xs"
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
                    <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 text-xs shadow-xs mb-1">
                      <Sparkles className="h-3.5 w-3.5 animate-spin-slow" />
                    </div>
                    <div className="rounded-2xl rounded-bl-xs bg-white border border-slate-200 px-4 py-3 shadow-xs flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
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
                    placeholder="Ask HandyAI (e.g. Best plumber, track booking)..."
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>Trained on HandyPro live services & rates</span>
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
