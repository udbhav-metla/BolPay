import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  X,
  Search,
  ArrowRight,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { Invoice, DuesQueryResult } from "../types";

interface DuesAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
}

const PRESET_QUESTIONS = [
  "Who still owes me?",
  "కిరణ్ ఎంత ఇవ్వాలి? (How much does Kiran owe?)",
  "रवि का कितना बाकी है? (How much does Ravi owe?)",
  "Which bills are overdue right now?",
  "How much total money is pending?",
];

export const DuesAssistantModal: React.FC<DuesAssistantModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onSelectInvoice,
}) => {
  const [query, setQuery] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<DuesQueryResult | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!isOpen) return null;

  const handleAsk = async (textToAsk: string) => {
    const q = textToAsk.trim();
    if (!q) return;

    setIsAsking(true);
    setQuery(q);

    // Detect language roughly
    const isTelugu = /[\u0C00-\u0C7F]/.test(q);
    const isHindi = /[\u0900-\u097F]/.test(q);
    const lang = isTelugu ? "te" : isHindi ? "hi" : "en";

    try {
      const res = await fetch("/api/ai/ask-dues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          invoices,
          language: lang,
        }),
      });

      if (!res.ok) throw new Error("Failed to process question.");

      const data: DuesQueryResult = await res.json();
      setResult(data);

      // Auto play answer with speech synthesis
      speakAnswer(data.spokenAnswer, lang);
    } catch (err) {
      console.error(err);
      // Fallback local search
      const pending = invoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE");
      const total = pending.reduce((sum, i) => sum + i.totalAmount, 0);
      const names = pending.map((i) => `${i.customer.name} (₹${i.totalAmount})`).join(", ");

      const fallbackResult: DuesQueryResult = {
        spokenAnswer: `You have ${pending.length} pending invoices totaling ₹${total.toLocaleString("en-IN")}: ${names}.`,
        totalPendingAmount: total,
        currency: "INR",
        matchingInvoiceIds: pending.map((i) => i.id),
        summaryCards: [
          { title: "Total Pending", value: `₹${total.toLocaleString()}`, detail: `${pending.length} invoices` },
          { title: "Next Due", value: pending[0]?.dueDate || "N/A", detail: pending[0]?.customer.name || "" },
        ],
      };
      setResult(fallbackResult);
      speakAnswer(fallbackResult.spokenAnswer, "en");
    } finally {
      setIsAsking(false);
    }
  };

  const speakAnswer = (text: string, lang: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === "te" ? "te-IN" : lang === "hi" ? "hi-IN" : "en-IN";
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      if (isRecording) {
        setIsRecording(false);
        return;
      }

      const rec = new SpeechRecognition();
      rec.lang = "en-IN";
      rec.onstart = () => setIsRecording(true);
      rec.onresult = (e: any) => {
        const spoken = e.results[0][0].transcript;
        setQuery(spoken);
        handleAsk(spoken);
        setIsRecording(false);
      };
      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
      rec.start();
    } else {
      // Simulate question
      const sample = "Who still owes me?";
      setQuery(sample);
      handleAsk(sample);
    }
  };

  const matchingInvoices = result
    ? invoices.filter((i) => result.matchingInvoiceIds.includes(i.id))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#003087] dark:text-sky-400" />
              Ask BolPay: "Who Still Owes Me?"
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ask in English, Hindi, or Telugu about pending payments, client dues, and deadlines
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
          {/* Preset Questions Strip */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Quick questions to try:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAsk(q)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Search / Voice Query Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk(query)}
                placeholder="Ask e.g. Who still owes me? or Did Ravi pay?"
                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#003087]"
              />
            </div>

            <button
              type="button"
              onClick={handleVoiceInput}
              className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all ${
                isRecording
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200"
              }`}
              title="Speak your question"
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={() => handleAsk(query)}
              disabled={isAsking || !query.trim()}
              className="min-h-[44px] px-4 rounded-xl bg-[#003087] hover:bg-[#002466] text-white font-medium text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
            >
              {isAsking ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  Ask AI
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* AI Spoken Answer Card */}
          {result && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 bg-sky-50 dark:bg-slate-800/80 rounded-xl border border-sky-100 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Spoken Answer:
                  </span>
                  <button
                    type="button"
                    onClick={() => speakAnswer(result.spokenAnswer, "en")}
                    className="text-xs text-sky-700 dark:text-sky-400 font-medium hover:underline flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {isPlayingAudio ? "Speaking..." : "Replay Voice"}
                  </button>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                  "{result.spokenAnswer}"
                </p>
              </div>

              {/* Metric summary pills */}
              {result.summaryCards && result.summaryCards.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {result.summaryCards.map((card, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800"
                    >
                      <span className="text-[11px] text-slate-400 block">{card.title}</span>
                      <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                        {card.value}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">{card.detail}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Matching Invoices List */}
              {matchingInvoices.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 block">
                    Invoices Answering Your Query:
                  </span>
                  <div className="space-y-2">
                    {matchingInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-sky-300 dark:hover:border-sky-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                            {inv.customer.name[0]}
                          </div>
                          <div>
                            <span className="font-semibold text-xs text-slate-900 dark:text-white">
                              {inv.customer.name}
                            </span>
                            <span className="text-slate-400 mx-1.5">·</span>
                            <span className="text-xs text-slate-500">{inv.items[0]?.name}</span>
                            <p className="text-[11px] text-slate-400">Due {inv.dueDate}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs tabular-nums text-slate-900 dark:text-white">
                            {inv.currency === "USD" ? "$" : "₹"}{inv.totalAmount.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onSelectInvoice(inv);
                            }}
                            className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-medium"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
