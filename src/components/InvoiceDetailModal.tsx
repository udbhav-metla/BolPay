import React, { useState } from "react";
import {
  X,
  CreditCard,
  QrCode,
  Share2,
  BellRing,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import type { Invoice } from "../types";

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onStatusChange: (invoiceId: string, newStatus: Invoice["status"]) => void;
  onOpenReminder: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose,
  onStatusChange,
  onOpenReminder,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrExpanded, setShowQrExpanded] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  if (!invoice) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invoice.paypalPaymentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSimulatePayment = () => {
    setIsSimulatingPayment(true);
    setTimeout(() => {
      onStatusChange(invoice.id, "PAID");
      setIsSimulatingPayment(false);
    }, 1000);
  };

  const encodedWhatsAppText = encodeURIComponent(
    `Hello ${invoice.customer.name}, here is your PayPal invoice for ${invoice.items[0]?.name || "services"}: ${invoice.paypalPaymentUrl}`
  );
  const cleanPhone = invoice.customer.phone.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedWhatsAppText}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#003087] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight">PayPal</span>
                <span className="text-xs uppercase bg-white/20 px-2 py-0.5 rounded-sm font-semibold tracking-wider">
                  Sandbox Invoicing
                </span>
              </div>
              <p className="text-xs text-sky-100 font-mono mt-0.5">
                {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status & Highlights */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Payment Status</span>
              <div className="flex items-center gap-2 mt-1">
                {invoice.status === "PAID" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Paid in PayPal Sandbox
                  </span>
                ) : invoice.status === "OVERDUE" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <Clock className="w-4 h-4" /> Payment Overdue
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-400">
                    <Clock className="w-4 h-4" /> Sent · Awaiting Payment
                  </span>
                )}
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">Due {invoice.dueDate}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Due</span>
              <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                {invoice.currency === "USD" ? "$" : "₹"}
                {invoice.totalAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Customer & Service Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block font-medium">Billed To</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{invoice.customer.name}</p>
              <p className="text-slate-600 dark:text-slate-400">{invoice.customer.phone}</p>
              <p className="text-slate-500">{invoice.customer.email}</p>
            </div>
            <div className="p-3.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block font-medium">Trade / Service Details</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                {invoice.serviceCategory}
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                Created: {invoice.createdAt} · Due: {invoice.dueDate}
              </p>
              {invoice.detectedLanguage && (
                <p className="text-sky-700 dark:text-sky-400 font-medium">
                  Voice input: {invoice.detectedLanguage}
                </p>
              )}
            </div>
          </div>

          {/* Original Voice Instruction */}
          {invoice.originalVoiceTranscript && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-amber-900 dark:text-amber-200 block">
                Original Voice Command:
              </span>
              <p className="italic text-amber-800 dark:text-amber-300">
                "{invoice.originalVoiceTranscript}"
              </p>
            </div>
          )}

          {/* Items Breakdown Table */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Itemized Charges:
            </span>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {invoice.items.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.name}</span>
                    {item.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right font-mono font-bold tabular-nums text-slate-900 dark:text-white">
                    {invoice.currency === "USD" ? "$" : "₹"}
                    {item.total.toLocaleString()}
                  </div>
                </div>
              ))}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between font-bold">
                <span className="text-slate-700 dark:text-slate-300">Total Invoice Amount</span>
                <span className="font-mono text-base tabular-nums text-slate-900 dark:text-white">
                  {invoice.currency === "USD" ? "$" : "₹"}
                  {invoice.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* PayPal Payment Link & QR Code */}
          <div className="p-4 bg-sky-50/50 dark:bg-slate-800/60 rounded-xl border border-sky-100 dark:border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              PayPal Sandbox Shareable Payment Link:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={invoice.paypalPaymentUrl}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-slate-600 dark:text-slate-300"
              />
              <button
                onClick={handleCopyLink}
                className="min-h-[44px] px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => setShowQrExpanded(!showQrExpanded)}
                className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1.5"
              >
                <QrCode className="w-4 h-4" />
                {showQrExpanded ? "Hide Customer QR Code" : "Show Instant QR Code for Scanning"}
              </button>
            </div>

            {showQrExpanded && (
              <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in">
                <img
                  src={invoice.qrCodeUrl}
                  alt="PayPal Invoice QR Code"
                  className="w-44 h-44 rounded-lg border border-slate-100 dark:border-slate-800"
                  referrerPolicy="no-referrer"
                />
                <p className="text-[11px] text-slate-500 mt-2 text-center">
                  Customer can scan this with phone camera or PayPal app to pay in Sandbox
                </p>
              </div>
            )}
          </div>

          {/* Hackathon Interactive Simulation Actions */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Hackathon Actions & Dispatch:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp Share */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                Send Invoice via WhatsApp
              </a>

              {/* Polite Reminder */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReminder(invoice);
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <BellRing className="w-4 h-4" />
                Generate Polite Voice Reminder
              </button>
            </div>

            {/* Simulate Customer Payment in Sandbox */}
            {invoice.status !== "PAID" && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isSimulatingPayment}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  {isSimulatingPayment ? (
                    <>
                      <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      Simulating PayPal Sandbox Receipt...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Simulate Customer Payment (Test as Ravi/Judge)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
