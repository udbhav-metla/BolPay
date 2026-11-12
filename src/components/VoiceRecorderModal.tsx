import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Sparkles, Check, ArrowRight, X, Volume2, Globe, Clock, AlertCircle } from "lucide-react";
import type { Language, VoiceParseResult, Invoice } from "../types";

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: (newInvoice: Invoice) => void;
  sandboxCredentials?: { clientId: string; clientSecret: string };
}

const PRESET_UTTERANCES = [
  {
    lang: "en",
    label: "English (Plumber)",
    text: "Bill Ravi ₹2500 for pipe repair, due Friday.",
    trade: "Plumbing",
  },
  {
    lang: "te",
    label: "తెలుగు (ప్లంబింగ్)",
    text: "రవికి పైప్ రిపేర్ కోసం ₹2500 బిల్ చేయండి, శుక్రవారం వరకు",
    trade: "Plumbing",
  },
  {
    lang: "hi",
    label: "हिन्दी (प्लम्बर)",
    text: "रवि को पाइप रिपेयर के ₹2500 का बिल शुक्रवार तक भेजो",
    trade: "Plumbing",
  },
  {
    lang: "hi",
    label: "हिन्दी (टेलरिंग)",
    text: "सुनीता जी को ब्लाउज सिलाई और फिटिंग के ₹1200 का बिल सोमवार तक भेजो",
    trade: "Tailoring",
  },
  {
    lang: "te",
    label: "తెలుగు (ట్యూషన్)",
    text: "కిరణ్ గారికి 8 మాథ్స్ క్లాసులకు ₹4000 బిల్ పంపండి, వచ్చే వారం వరకు",
    trade: "Tutoring",
  },
];

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onInvoiceCreated,
  sandboxCredentials,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("en");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<VoiceParseResult | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition if available in browser
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      const langMap: Record<Language, string> = {
        en: "en-IN",
        hi: "hi-IN",
        te: "te-IN",
      };
      recognition.lang = langMap[selectedLanguage];

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript.trim()) {
          setTranscript((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [selectedLanguage]);

  if (!isOpen) return null;

  const toggleRecording = () => {
    setErrorMessage(null);
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      setTranscript("");
      setParsedData(null);
      if (recognitionRef.current) {
        try {
          const langMap: Record<Language, string> = {
            en: "en-IN",
            hi: "hi-IN",
            te: "te-IN",
          };
          recognitionRef.current.lang = langMap[selectedLanguage];
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (err) {
          console.error("Speech start error:", err);
          // Fallback simulation notice
          setIsRecording(true);
        }
      } else {
        // Fallback for browsers without Web Speech
        setIsRecording(true);
        setTimeout(() => {
          setTranscript("Bill Ravi ₹2500 for pipe repair, due Friday.");
          setIsRecording(false);
        }, 1800);
      }
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_UTTERANCES[0]) => {
    setSelectedLanguage(preset.lang as Language);
    setTranscript(preset.text);
    setParsedData(null);
    setErrorMessage(null);
  };

  const handleParseWithGemini = async () => {
    if (!transcript.trim()) {
      setErrorMessage("Please speak or type an invoicing command first.");
      return;
    }

    setIsParsing(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/ai/parse-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcript,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to parse voice command with Gemini.");
      }

      const data: VoiceParseResult = await response.json();
      setParsedData(data);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to parse command. Please check your network or API key.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleCreatePayPalInvoice = async () => {
    if (!parsedData) return;

    setIsCreatingInvoice(true);
    setErrorMessage(null);

    try {
      const invoicePayload = {
        invoiceData: {
          customerName: parsedData.recipientName,
          customerEmail: parsedData.recipientEmail || "customer@example.com",
          customerPhone: parsedData.recipientPhone || "+91 98765 43210",
          items: parsedData.items,
          totalAmount: parsedData.totalAmount,
          currency: parsedData.currency,
          dueDate: parsedData.dueDate,
          note: `Voice created via BolPay in ${parsedData.detectedLanguage}`,
        },
        credentials: sandboxCredentials,
      };

      const res = await fetch("/api/paypal/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoicePayload),
      });

      if (!res.ok) {
        throw new Error("Failed to generate PayPal Sandbox invoice.");
      }

      const paypalRes = await res.json();

      const newInvoice: Invoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: paypalRes.invoiceNumber,
        paypalInvoiceId: paypalRes.paypalInvoiceId,
        customer: {
          id: `cust-${Date.now()}`,
          name: parsedData.recipientName,
          phone: parsedData.recipientPhone || "+91 98765 43210",
          email: parsedData.recipientEmail || "client@example.com",
          preferredLanguage: selectedLanguage,
        },
        items: parsedData.items.map((it, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          name: it.name,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          total: it.quantity * it.unitPrice,
        })),
        currency: parsedData.currency,
        subtotal: parsedData.totalAmount,
        tax: 0,
        totalAmount: parsedData.totalAmount,
        createdAt: new Date().toISOString().split("T")[0],
        dueDate: parsedData.dueDate,
        status: "SENT",
        serviceCategory: parsedData.serviceCategory,
        notes: parsedData.friendlySummary,
        paypalPaymentUrl: paypalRes.paypalPaymentUrl,
        qrCodeUrl: paypalRes.qrCodeUrl,
        detectedLanguage: parsedData.detectedLanguage,
        originalVoiceTranscript: transcript,
      };

      onInvoiceCreated(newInvoice);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to create invoice with PayPal API.");
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-[#003087] dark:text-sky-400">BolPay</span> Voice Invoicing
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Speak in English, Hindi, or Telugu to create an official PayPal Sandbox invoice
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Language Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-slate-500" /> Spoken Language:
            </span>
            <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xs">
              <button
                type="button"
                onClick={() => setSelectedLanguage("en")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedLanguage === "en"
                    ? "bg-[#003087] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage("hi")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedLanguage === "hi"
                    ? "bg-[#003087] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                हिन्दी (Hindi)
              </button>
              <button
                type="button"
                onClick={() => setSelectedLanguage("te")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedLanguage === "te"
                    ? "bg-[#003087] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                తెలుగు (Telugu)
              </button>
            </div>
          </div>

          {/* Quick Preset Utterances (Hackathon one-tap testing) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tap a realistic spoken example (Hindi, Telugu, English):
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_UTTERANCES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="text-left text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-500 transition-all flex items-center gap-2 group"
                >
                  <span className="font-semibold text-sky-700 dark:text-sky-300 group-hover:underline">
                    {preset.label}:
                  </span>
                  <span className="italic text-slate-600 dark:text-slate-400">"{preset.text}"</span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Input Section */}
          <div className="flex flex-col items-center justify-center p-6 bg-radial from-sky-50/50 via-slate-50 to-white dark:from-slate-800/40 dark:via-slate-900 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative mb-4">
              {isRecording && (
                <span className="absolute -inset-3 rounded-full bg-red-500/20 animate-ping" />
              )}
              <button
                type="button"
                onClick={toggleRecording}
                className={`relative min-h-[72px] min-w-[72px] rounded-full flex items-center justify-center text-white transition-all shadow-lg active:scale-95 ${
                  isRecording
                    ? "bg-red-600 shadow-red-500/30 ring-4 ring-red-200 dark:ring-red-900"
                    : "bg-[#003087] hover:bg-[#002466] shadow-[#003087]/30 hover:scale-105"
                }`}
                title={isRecording ? "Stop recording" : "Click to speak"}
              >
                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
            </div>

            {/* Audio Waveform Feedback */}
            {isRecording ? (
              <div className="flex items-center gap-1.5 h-8 my-2">
                <span className="w-1.5 bg-red-500 rounded-full animate-wave-1" />
                <span className="w-1.5 bg-red-500 rounded-full animate-wave-2" />
                <span className="w-1.5 bg-red-500 rounded-full animate-wave-3" />
                <span className="w-1.5 bg-red-500 rounded-full animate-wave-4" />
                <span className="w-1.5 bg-red-500 rounded-full animate-wave-5" />
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 ml-2">
                  Listening in {selectedLanguage.toUpperCase()}... Speak naturally
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tap microphone to speak, or pick an example above
              </p>
            )}

            {/* Live Transcript Text Box */}
            <div className="w-full mt-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Spoken Instruction / Transcript:
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="e.g., Bill Ravi ₹2500 for pipe repair, due Friday..."
                rows={3}
                className="w-full text-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#003087] dark:focus:ring-sky-500"
              />
            </div>

            {/* Parse Button */}
            <div className="w-full flex justify-end mt-3">
              <button
                type="button"
                onClick={handleParseWithGemini}
                disabled={isParsing || !transcript.trim()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap min-h-[44px]"
              >
                {isParsing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white dark:border-slate-900 border-t-transparent rounded-full animate-spin" />
                    AI Analyzing Audio...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Parse Invoice with AI
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* AI Parsed Results Confirmation */}
          {parsedData && (
            <div className="p-5 bg-sky-50/70 dark:bg-slate-800/80 rounded-2xl border border-sky-200 dark:border-sky-900 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between border-b border-sky-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      AI Extracted Invoice Summary
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Detected: {parsedData.detectedLanguage} · Confidence: {Math.round(parsedData.confidenceScore * 100)}%
                    </p>
                  </div>
                </div>
                <span className="text-lg font-bold font-mono text-[#003087] dark:text-sky-400 tabular-nums">
                  {parsedData.currency === "USD" ? "$" : "₹"}{parsedData.totalAmount.toLocaleString()}
                </span>
              </div>

              {/* Friendly summary in native language */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-sky-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span className="italic">{parsedData.friendlySummary}</span>
              </div>

              {/* Grid of parsed details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500 block">Recipient</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{parsedData.recipientName}</span>
                  <span className="text-[11px] text-slate-500 block">{parsedData.recipientPhone}</span>
                </div>
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500 block">Due Date</span>
                  <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {parsedData.dueDate}
                  </span>
                  <span className="text-[11px] text-slate-500 block">Service: {parsedData.serviceCategory}</span>
                </div>
              </div>

              {/* Line items list */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Line Items:</span>
                {parsedData.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs py-1.5 px-2.5 bg-white dark:bg-slate-900 rounded-md border border-slate-100 dark:border-slate-800"
                  >
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
                      )}
                    </div>
                    <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">
                      {parsedData.currency === "USD" ? "$" : "₹"}{(item.quantity * item.unitPrice).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={handleCreatePayPalInvoice}
                disabled={isCreatingInvoice}
                className="w-full h-12 rounded-xl bg-[#003087] hover:bg-[#002466] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#003087]/20 active:scale-[0.99] transition-all disabled:opacity-50 min-h-[48px]"
              >
                {isCreatingInvoice ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting to PayPal Invoicing Sandbox...
                  </>
                ) : (
                  <>
                    Create & Send PayPal Sandbox Invoice
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
