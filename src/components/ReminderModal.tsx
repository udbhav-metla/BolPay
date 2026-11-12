import React, { useState, useEffect } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Send,
  MessageSquare,
  Sparkles,
  Globe,
  Share2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { Invoice, Language } from "../types";

interface ReminderModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const [tone, setTone] = useState<"gentle" | "standard" | "urgent">("gentle");
  const [language, setLanguage] = useState<Language>("te");
  const [isLoading, setIsLoading] = useState(false);
  const [reminderText, setReminderText] = useState("");
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [smsUrl, setSmsUrl] = useState("");

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Set default language from customer preferred language
  useEffect(() => {
    if (invoice) {
      setLanguage(invoice.customer.preferredLanguage || "en");
      generateReminder(invoice, tone, invoice.customer.preferredLanguage || "en");
    }
  }, [invoice]);

  const generateReminder = async (
    targetInvoice: Invoice,
    selectedTone: "gentle" | "standard" | "urgent",
    selectedLang: Language
  ) => {
    setIsLoading(true);
    setAudioError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    }

    try {
      const res = await fetch("/api/ai/generate-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice: targetInvoice,
          tone: selectedTone,
          language: selectedLang,
        }),
      });

      if (!res.ok) throw new Error("Failed to craft polite reminder.");

      const data = await res.json();
      setReminderText(data.messageText);
      setAudioBase64(data.audioBase64 || null);
      setWhatsappUrl(data.whatsappUrl);
      setSmsUrl(data.smsUrl);
    } catch (err: any) {
      console.error(err);
      // Fallback message
      const defaultText =
        selectedLang === "te"
          ? `నమస్కారం ${targetInvoice.customer.name} గారు, మీ ${targetInvoice.items[0]?.name || "పని"} బిల్లు ₹${targetInvoice.totalAmount} చెల్లింపు కొరకు సున్నితమైన రిమైండర్. పేపాల్ లింక్: ${targetInvoice.paypalPaymentUrl}. ధన్యవాదాలు!`
          : selectedLang === "hi"
          ? `नमस्ते ${targetInvoice.customer.name} जी, आपके ${targetInvoice.items[0]?.name || "काम"} का बिल ₹${targetInvoice.totalAmount} का भुगतान बाकी है। कृपया इस पेपाल लिंक से भुगतान करें: ${targetInvoice.paypalPaymentUrl}. धन्यवाद!`
          : `Hello ${targetInvoice.customer.name}, gentle reminder about your invoice for ${targetInvoice.items[0]?.name || "services"} of ₹${targetInvoice.totalAmount}. Pay securely via PayPal: ${targetInvoice.paypalPaymentUrl}. Thank you!`;

      setReminderText(defaultText);
      const cleanPhone = targetInvoice.customer.phone.replace(/[^0-9]/g, "");
      setWhatsappUrl(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultText)}`);
      setSmsUrl(`sms:${cleanPhone}?body=${encodeURIComponent(defaultText)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = () => {
    if (!audioBase64) {
      // Use client-side Web SpeechSynthesis as fallback if server TTS has no audio
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(reminderText);
        const langMap: Record<Language, string> = {
          en: "en-IN",
          hi: "hi-IN",
          te: "te-IN",
        };
        utterance.lang = langMap[language];
        utterance.onstart = () => setIsPlayingAudio(true);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(`data:audio/wav;base64,${audioBase64}`);
      audioRef.current.onended = () => setIsPlayingAudio(false);
      audioRef.current.onerror = () => {
        setAudioError("Could not play synthesized audio clip.");
        setIsPlayingAudio(false);
      };
    }

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.warn("Audio play prevented:", err);
        setIsPlayingAudio(false);
      });
      setIsPlayingAudio(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reminderText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Multilingual Polite Reminder
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Respectful follow-up in customer's mother tongue with audio voice note
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Recipient summary strip */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block">Customer</span>
              <span className="font-semibold text-slate-900 dark:text-white">{invoice.customer.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Amount Due</span>
              <span className="font-mono font-bold text-[#003087] dark:text-sky-400 tabular-nums">
                {invoice.currency === "USD" ? "$" : "₹"}{invoice.totalAmount.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Due Date</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{invoice.dueDate}</span>
            </div>
          </div>

          {/* Tone & Language Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Tone of Reminder:
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(["gentle", "standard", "urgent"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setTone(t);
                      generateReminder(invoice, t, language);
                    }}
                    className={`py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                      tone === t
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Customer Language:
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(
                  [
                    { code: "te", label: "తెలుగు" },
                    { code: "hi", label: "हिन्दी" },
                    { code: "en", label: "English" },
                  ] as const
                ).map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      generateReminder(invoice, tone, lang.code);
                    }}
                    className={`py-1.5 text-xs font-medium rounded-md transition-colors ${
                      language === lang.code
                        ? "bg-[#003087] text-white shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generated Message Preview Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                Generated Message (Culturally Respectful):
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-sky-700 dark:text-sky-400 font-medium hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy text"}
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 min-h-[90px] relative">
              {isLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-500">
                  <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Gemini generating respectful reminder & audio note...
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{reminderText}</p>
              )}
            </div>
          </div>

          {/* Audio Voice Note Player */}
          <div className="p-4 bg-amber-50/70 dark:bg-slate-800/70 rounded-xl border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayAudio}
                disabled={isLoading}
                className={`min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-all shadow-xs ${
                  isPlayingAudio
                    ? "bg-amber-600 text-white animate-pulse"
                    : "bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 hover:scale-105"
                }`}
              >
                {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  AI Voice Note Playback
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Synthesized in {language === "te" ? "Telugu" : language === "hi" ? "Hindi" : "Indian English"} using Gemini TTS
                </p>
              </div>
            </div>

            {isPlayingAudio && (
              <div className="flex items-center gap-1 h-6">
                <span className="w-1 bg-amber-600 rounded-full animate-wave-1" />
                <span className="w-1 bg-amber-600 rounded-full animate-wave-2" />
                <span className="w-1 bg-amber-600 rounded-full animate-wave-3" />
                <span className="w-1 bg-amber-600 rounded-full animate-wave-4" />
              </div>
            )}
          </div>

          {/* Dispatch Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              Send to Customer on WhatsApp
            </a>

            <a
              href={smsUrl}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
              Send via Standard SMS
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
