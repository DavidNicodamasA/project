/**
 * AI Image-Based Problem Detection Component
 * Path: src/modules/user/components/ImageProblemDetector.jsx
 * 
 * Powered by Google Gemini Vision API with Intelligent Multi-Domain Diagnostic Engine.
 * Allows camera capture, drag-and-drop, issue diagnosis, urgency rating,
 * safety warning, and direct transition to booking.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Clock,
  Wrench,
  DollarSign,
  X,
  Key,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';
import axios from 'axios';

const QUICK_SYMPTOM_HINTS = [
  { id: 'camera', label: '📷 Camera / Optical / Gadget', category: 'appliance' },
  { id: 'appliance', label: '🔌 Appliance (Fridge/Washer/TV)', category: 'appliance' },
  { id: 'plumbing', label: '🚰 Water / Pipe Leak', category: 'plumbing' },
  { id: 'electrical', label: '⚡ Electrical / Sparks / Wiring', category: 'electrical' },
  { id: 'hvac', label: '❄️ AC / Cooling Defect', category: 'hvac' },
  { id: 'carpentry', label: '🪚 Door / Hinge / Carpentry', category: 'carpentry' },
  { id: 'general', label: '🛠️ General Household Fix', category: 'general' },
];

export default function ImageProblemDetector({ onSelectServiceCategory, onBookSpecialist, onClose }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFileName, setImageFileName] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [selectedHint, setSelectedHint] = useState('');
  const [apiKeyOverride, setApiKeyOverride] = useState(() => localStorage.getItem('handypro_gemini_key') || '');
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Image size is too large (maximum 15MB).');
      return;
    }

    setErrorMessage('');
    setImageFileName(file.name);

    // Auto-detect hint from filename if present
    const lowerName = file.name.toLowerCase();
    if (lowerName.includes('lens') || lowerName.includes('camera') || lowerName.includes('50') || lowerName.includes('optic')) {
      setSelectedHint('camera');
    } else if (lowerName.includes('leak') || lowerName.includes('pipe') || lowerName.includes('tap')) {
      setSelectedHint('plumbing');
    } else if (lowerName.includes('wire') || lowerName.includes('switch') || lowerName.includes('spark')) {
      setSelectedHint('electrical');
    } else if (lowerName.includes('ac') || lowerName.includes('cool')) {
      setSelectedHint('hvac');
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
      setImageBase64(reader.result);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  // Camera stream handler
  const startCamera = async () => {
    setErrorMessage('');
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setIsCameraActive(false);
      setErrorMessage('Camera access was denied or is not supported. Please upload an image instead.');
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setSelectedImage(dataUrl);
    setImageBase64(dataUrl);
    setImageFileName('camera_capture.jpg');
    setAnalysisResult(null);
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const resetAll = () => {
    setSelectedImage(null);
    setImageBase64('');
    setImageFileName('');
    setSelectedHint('');
    setAnalysisResult(null);
    setErrorMessage('');
    stopCamera();
  };

  const handleSaveApiKey = (key) => {
    setApiKeyOverride(key);
    if (key.trim()) {
      localStorage.setItem('handypro_gemini_key', key.trim());
    } else {
      localStorage.removeItem('handypro_gemini_key');
    }
  };

  // Run AI Vision Diagnostics
  const handleAnalyzeImage = async () => {
    if (!imageBase64) {
      setErrorMessage('Please upload or capture an image first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');
    setAnalysisProgress(20);

    const progressTimer = setInterval(() => {
      setAnalysisProgress((prev) => (prev < 88 ? prev + 14 : prev));
    }, 350);

    try {
      const hintObj = QUICK_SYMPTOM_HINTS.find((h) => h.id === selectedHint);
      const categoryHint = hintObj?.category || (selectedHint === 'camera' ? 'appliance' : '');

      const response = await axios.post('/api/v1/ai/analyze-image', {
        imageBase64,
        mimeType: imageBase64.match(/:(.*?);/)?.[1] || 'image/jpeg',
        userNotes: userNotes.trim(),
        imageFileName: imageFileName || (selectedHint ? `${selectedHint}_device.jpg` : ''),
        categoryHint,
        apiKeyOverride: apiKeyOverride.trim(),
        customerId: 'cust-user',
        customerName: 'HandyPro Customer',
      });

      clearInterval(progressTimer);
      setAnalysisProgress(100);

      if (response.data && response.data.success) {
        setAnalysisResult(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to analyze image');
      }
    } catch (err) {
      clearInterval(progressTimer);
      setErrorMessage(
        err.response?.data?.message || 'AI Vision Diagnostic service encountered a temporary issue. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'emergency':
        return {
          bg: 'bg-red-600 text-white border-red-700 animate-pulse',
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'CRITICAL EMERGENCY',
        };
      case 'high':
        return {
          bg: 'bg-amber-500 text-white border-amber-600',
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'HIGH PRIORITY',
        };
      case 'medium':
        return {
          bg: 'bg-blue-600 text-white border-blue-700',
          icon: <Clock className="h-4 w-4" />,
          label: 'STANDARD SCHEDULE',
        };
      default:
        return {
          bg: 'bg-emerald-600 text-white border-emerald-700',
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'ROUTINE CHECKUP',
        };
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 p-6 shadow-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>AI Visual Problem Diagnostic</span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-extrabold text-blue-700 uppercase tracking-wide">
                Vision Engine
              </span>
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              Snap or upload photos of damaged appliances, camera gear, pipe leaks, or electrical wiring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Key config toggle */}
          <button
            type="button"
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            title="Google Gemini API Key Config"
          >
            <Key className="h-4 w-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Optional Gemini API Key Drawer */}
      {showKeyConfig && (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-blue-600" />
              <span>Google Gemini Vision API Key (Optional)</span>
            </span>
            <span className="text-[10px] text-slate-500">Google AI Studio</span>
          </div>
          <input
            type="password"
            placeholder="Paste AIzaSy... key to use your own quota (Optional)"
            value={apiKeyOverride}
            onChange={(e) => handleSaveApiKey(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono bg-white focus:outline-none focus:border-blue-600"
          />
          <p className="text-[10px] text-slate-500">
            If left blank, HandyPro's intelligent local diagnostic engine analyzes your fixture automatically.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="mt-5 space-y-5">
        {/* Upload & Camera Trigger */}
        {!selectedImage && !isCameraActive && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-blue-300 bg-white/70 hover:bg-blue-50/50 p-6 text-center transition flex flex-col items-center justify-center group"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 group-hover:scale-110 transition">
                <Upload className="h-7 w-7" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-800">Upload Issue Photo</h4>
              <p className="mt-1 text-xs text-slate-500">Click or drag photos of damaged devices, leaks, appliances</p>
              <span className="mt-3 rounded-lg bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200">
                Supports JPG, PNG, WEBP (Max 15MB)
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Live Camera Box */}
            <div
              onClick={startCamera}
              className="cursor-pointer rounded-2xl border-2 border-dashed border-indigo-300 bg-white/70 hover:bg-indigo-50/50 p-6 text-center transition flex flex-col items-center justify-center group"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 group-hover:scale-110 transition">
                <Camera className="h-7 w-7" />
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-800">Take Live Camera Photo</h4>
              <p className="mt-1 text-xs text-slate-500">Capture direct photo from smartphone or webcam</p>
              <span className="mt-3 rounded-lg bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 border border-indigo-200">
                Instant Camera Stream
              </span>
            </div>
          </div>
        )}

        {/* Live Camera View */}
        {isCameraActive && (
          <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-black text-center shadow-lg">
            <video ref={videoRef} autoPlay playsInline className="w-full max-h-80 object-cover" />
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/80 to-transparent p-4">
              <button
                type="button"
                onClick={captureCameraPhoto}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/40"
              >
                <Camera className="h-4 w-4" />
                <span>Capture Photo</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2.5 rounded-full bg-slate-700 hover:bg-slate-800 text-white font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Preview & Diagnosis Panel */}
        {selectedImage && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Image Preview Box */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group max-h-72">
                <img
                  src={selectedImage}
                  alt="Household problem"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={resetAll}
                  className="absolute top-3 right-3 rounded-full bg-black/60 hover:bg-black/80 text-white p-1.5 backdrop-blur-sm transition"
                  title="Retake or choose different image"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-3 text-[11px] font-semibold text-white/90 bg-black/50 px-2 py-0.5 rounded truncate max-w-[85%]">
                  {imageFileName || 'Photo Loaded'}
                </div>
              </div>

              {/* Customer Notes & Quick Hints */}
              <div className="md:col-span-2 flex flex-col justify-between space-y-3">
                {/* Quick Symptom Chips */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Tag className="h-3 w-3 text-blue-600" />
                    <span>Quick Device / Symptom Hint (Optional):</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_SYMPTOM_HINTS.map((hint) => (
                      <button
                        key={hint.id}
                        type="button"
                        onClick={() => setSelectedHint(selectedHint === hint.id ? '' : hint.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                          selectedHint === hint.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {hint.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Describe what you are experiencing (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="e.g. Camera lens focus ring is sticking; water is dripping under sink; AC fan making noise..."
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleAnalyzeImage}
                    disabled={isAnalyzing}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Diagnosing Component...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Run AI Problem Diagnostics</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    disabled={isAnalyzing}
                    className="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Retake Photo
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Loading Progress Bar */}
            {isAnalyzing && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                    <span>Analyzing component contours, mechanics, wear & hazard markers...</span>
                  </span>
                  <span>{analysisProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* DIAGNOSTIC RESULTS DISPLAY */}
            {analysisResult && (
              <div className="mt-4 rounded-2xl border-2 border-indigo-200 bg-white p-6 shadow-md space-y-5 animate-in fade-in">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-indigo-50 border border-indigo-200 px-3 py-1.5 text-xs font-extrabold text-indigo-700 uppercase tracking-wide">
                      Category: {analysisResult.predictedCategory?.toUpperCase()}
                    </span>
                    <span className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
                      Confidence: {Math.round((analysisResult.confidenceScore || 0.85) * 100)}%
                    </span>
                  </div>

                  {/* Urgency Badge */}
                  {(() => {
                    const badge = getUrgencyBadge(analysisResult.urgencyLevel);
                    return (
                      <span
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-black tracking-wide border flex items-center gap-1.5 ${badge.bg}`}
                      >
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Primary Issue & Description */}
                <div>
                  <h4 className="text-base font-black text-slate-900">{analysisResult.primaryIssue}</h4>
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed font-medium">
                    {analysisResult.problemDescription}
                  </p>
                </div>

                {/* Detected Symptoms & Recommended Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Wrench className="h-4 w-4 text-blue-600" />
                      <span>Required Technician Skills:</span>
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.recommendedSkills?.map((skill, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                    <h5 className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      <span>Estimated Diagnostic Repair Cost:</span>
                    </h5>
                    <div className="text-lg font-black text-emerald-800">
                      ${analysisResult.estimatedPriceRange?.min || 45} – ${analysisResult.estimatedPriceRange?.max || 95}
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      Standard labor & precision diagnostic check
                    </p>
                  </div>
                </div>

                {/* MANDATORY SAFETY NOTICE DISCLAIMER */}
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs font-semibold text-amber-900 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-amber-950">Mandatory AI Diagnostic Safety Notice:</span>
                    <span>
                      {analysisResult.safetyNotice ||
                        '⚠️ AI diagnostic prediction only. Never declare gas, electrical, or structural issues safe without professional on-site evaluation.'}
                    </span>
                  </div>
                </div>

                {/* Direct Action Button to Provider Allocation */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectServiceCategory) {
                        onSelectServiceCategory(analysisResult.predictedCategory);
                      }
                      if (onBookSpecialist) {
                        onBookSpecialist(analysisResult);
                      }
                    }}
                    className="flex-1 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition hover:scale-[1.01]"
                  >
                    <span>View Matched Specialists in {analysisResult.predictedCategory?.toUpperCase()}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
