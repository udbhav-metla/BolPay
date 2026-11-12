import React, { useState, useEffect } from "react";
import {
  Mic,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  QrCode,
  MessageSquare,
  BellRing,
  CreditCard,
  Volume2,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Users,
  Wrench,
  Scissors,
  GraduationCap,
  Zap,
} from "lucide-react";
import { Navbar } from "./components/Navbar";
import { VoiceRecorderModal } from "./components/VoiceRecorderModal";
import { InvoiceDetailModal } from "./components/InvoiceDetailModal";
import { ReminderModal } from "./components/ReminderModal";
import { DuesAssistantModal } from "./components/DuesAssistantModal";
import { PayPalSettingsDrawer } from "./components/PayPalSettingsDrawer";
import { SEED_INVOICES } from "./data/seedInvoices";
import type { Invoice, InvoiceStatus, PayPalConfig } from "./types";

export default function App() {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem("bolpay_invoices");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return SEED_INVOICES;
  });

  const [paypalConfig, setPaypalConfig] = useState<PayPalConfig>(() => {
    const saved = localStorage.getItem("bolpay_paypal_config");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return {
      clientId: "",
      clientSecret: "",
      useLiveSandbox: false,
      merchantEmail: "merchant@bolpay.sandbox",
      businessName: "BolPay Artisan Services",
    };
  });

  const [activeTab, setActiveTab] = useState<"invoices" | "assistant" | "voice">("invoices");
  const [filterStatus, setFilterStatus] = useState<"ALL" | InvoiceStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);

  // Modals state
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isDuesModalOpen, setIsDuesModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark") || false;
  });

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Persist invoices
  useEffect(() => {
    localStorage.setItem("bolpay_invoices", JSON.stringify(invoices));
  }, [invoices]);

  // Persist PayPal config
  const handleSaveConfig = (updated: PayPalConfig) => {
    setPaypalConfig(updated);
    localStorage.setItem("bolpay_paypal_config", JSON.stringify(updated));
  };

  const handleInvoiceCreated = (newInvoice: Invoice) => {
    setInvoices((prev) => [newInvoice, ...prev]);
    setSelectedInvoice(newInvoice);
  };

  const handleStatusChange = (invoiceId: string, newStatus: InvoiceStatus) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: newStatus,
              paidAt: newStatus === "PAID" ? new Date().toISOString() : inv.paidAt,
            }
          : inv
      )
    );
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  // Metrics
  const totalCollected = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const totalPending = invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesFilter =
      filterStatus === "ALL" ? true : inv.status === filterStatus;
    const matchesSearch =
      inv.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.items.some((it) => it.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getCategoryIcon = (category: Invoice["serviceCategory"]) => {
    switch (category) {
      case "plumbing":
        return <Wrench className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case "tailoring":
        return <Scissors className="w-4 h-4 text-pink-600 dark:text-pink-400" />;
      case "tutoring":
        return <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "electrical":
        return <Zap className="w-4 h-4 text-amber-500" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-24 md:pb-12">
      {/* 3-Zone Top Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === "assistant") setIsDuesModalOpen(true);
          if (tab === "voice") setIsVoiceModalOpen(true);
        }}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        isLiveSandbox={Boolean(paypalConfig.clientId && paypalConfig.clientSecret)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section & Spoken Voice Action Card */}
        <section className="bg-gradient-to-br from-[#003087] via-[#002466] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-200">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>PayPal AI Hackathon · Voice Invoicing for Informal Workers</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Speak in Hindi, Telugu or English.
              <br />
              <span className="text-sky-300">BolPay turns your voice into a PayPal invoice.</span>
            </h1>

            <p className="text-sm sm:text-base text-sky-100/90 max-w-2xl leading-relaxed">
              Tailored for plumbers, tutors, tailors, and electricians. Say:{" "}
              <span className="italic font-medium text-amber-200">
                “Bill Ravi ₹2500 for pipe repair, due Friday”
              </span>{" "}
              or in Telugu:{" "}
              <span className="italic font-medium text-amber-200">
                “రవికి పైప్ రిపేర్ కోసం ₹2500 బిల్ చేయండి”
              </span>
              . Get instant PayPal links, QR codes, and polite customer reminders.
            </p>

            {/* Quick Hero Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className="min-h-[48px] px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Mic className="w-5 h-5 text-slate-950" />
                <span>Speak Invoice Now</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDuesModalOpen(true)}
                className="min-h-[48px] px-5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm flex items-center gap-2 transition-colors"
              >
                <Volume2 className="w-4 h-4 text-sky-300" />
                <span>Ask: "Who Still Owes Me?"</span>
              </button>
            </div>
          </div>

          {/* Decorative Background Accent */}
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        </section>

        {/* Financial Metrics Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Pending */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Pending Customer Dues
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                ₹{totalPending.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                {invoices.filter((i) => i.status === "SENT" || i.status === "OVERDUE").length} active
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <span>Awaiting payment</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => setIsDuesModalOpen(true)}
                className="text-sky-700 dark:text-sky-400 hover:underline font-medium"
              >
                Query with voice
              </button>
            </div>
          </div>

          {/* Overdue Bills */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Overdue Invoices
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                {overdueCount}
              </span>
              <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                Action required
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <span>Late payments</span>
              <span aria-hidden="true">·</span>
              <span>Polite multilingual follow-up ready</span>
            </div>
          </div>

          {/* Collected */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Collected via PayPal Sandbox
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                ₹{totalCollected.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                {invoices.filter((i) => i.status === "PAID").length} settled
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <span>Instant QR & payment links</span>
              <span aria-hidden="true">·</span>
              <span>Direct to merchant</span>
            </div>
          </div>
        </section>

        {/* Invoices List / Management Section */}
        <section className="space-y-4">
          {/* Controls Bar: Filter tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-xl overflow-x-auto">
              {(
                [
                  { id: "ALL", label: "All Invoices" },
                  { id: "SENT", label: "Pending" },
                  { id: "OVERDUE", label: "Overdue" },
                  { id: "PAID", label: "Paid" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id as any)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
                    filterStatus === tab.id
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Ravi, Sunita, pipe repair..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#003087]"
              />
            </div>
          </div>

          {/* Invoices Grid */}
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No invoices found matching your filter.
              </p>
              <button
                type="button"
                onClick={() => setIsVoiceModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#003087] text-white text-xs font-semibold"
              >
                <Mic className="w-4 h-4" />
                Speak to Create One
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Top card row: Category, Customer, Amount */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {getCategoryIcon(inv.serviceCategory)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {inv.customer.name}
                          </h3>
                        </div>

                        {/* Unboxed metadata with typographic separators */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="capitalize">{inv.serviceCategory}</span>
                          <span aria-hidden="true">·</span>
                          <span>Due {inv.dueDate}</span>
                          {inv.status === "PAID" && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                Paid
                              </span>
                            </>
                          )}
                          {inv.status === "OVERDUE" && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                Overdue
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base sm:text-lg font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                        {inv.currency === "USD" ? "$" : "₹"}
                        {inv.totalAmount.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 block">
                        {inv.invoiceNumber}
                      </span>
                    </div>
                  </div>

                  {/* Primary Service Item Description */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {inv.items[0]?.name}
                    </span>
                    {inv.originalVoiceTranscript && (
                      <p className="text-[11px] italic text-slate-500 dark:text-slate-400 line-clamp-1">
                        Spoken: "{inv.originalVoiceTranscript}"
                      </p>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(inv)}
                      className="text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 min-h-[40px]"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      View Invoice & QR
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Remind button */}
                      {inv.status !== "PAID" && (
                        <button
                          type="button"
                          onClick={() => setReminderInvoice(inv)}
                          className="min-h-[40px] px-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-900 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                          Remind
                        </button>
                      )}

                      {/* WhatsApp quick dispatch */}
                      <a
                        href={`https://wa.me/${inv.customer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `Hello ${inv.customer.name}, your invoice for ${inv.items[0]?.name || "services"} of ₹${inv.totalAmount} is ready. Pay via PayPal: ${inv.paypalPaymentUrl}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900 transition-colors"
                        title="Send via WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Live PayPal Sandbox Quick Info Callout */}
        <section className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#003087]/10 text-[#003087] dark:text-sky-400 flex items-center justify-center font-bold">
              P
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                PayPal Sandbox Invoicing Active
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connected to Sandbox endpoint <code>https://api-m.sandbox.paypal.com/v2/invoicing/invoices</code>. Instant QR code verification enabled.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[40px] whitespace-nowrap self-start sm:self-auto"
          >
            Manage Credentials
          </button>
        </section>
      </main>

      {/* Floating Bottom Action Bar on Mobile Viewports (<=15% sticky cap) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 flex items-center justify-around">
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium ${
            activeTab === "invoices" ? "text-[#003087] dark:text-sky-400 font-bold" : "text-slate-500"
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Invoices</span>
        </button>

        <button
          onClick={() => setIsVoiceModalOpen(true)}
          className="min-h-[48px] min-w-[48px] -mt-5 rounded-full bg-[#003087] text-white flex items-center justify-center shadow-lg shadow-[#003087]/30"
          title="Speak Invoice"
        >
          <Mic className="w-6 h-6" />
        </button>

        <button
          onClick={() => setIsDuesModalOpen(true)}
          className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium ${
            activeTab === "assistant" ? "text-[#003087] dark:text-sky-400 font-bold" : "text-slate-500"
          }`}
        >
          <Volume2 className="w-5 h-5" />
          <span>Who Owes Me</span>
        </button>
      </div>

      {/* Modals & Drawers */}
      <VoiceRecorderModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onInvoiceCreated={handleInvoiceCreated}
        sandboxCredentials={
          paypalConfig.clientId && paypalConfig.clientSecret
            ? { clientId: paypalConfig.clientId, clientSecret: paypalConfig.clientSecret }
            : undefined
        }
      />

      <InvoiceDetailModal
        invoice={selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        onStatusChange={handleStatusChange}
        onOpenReminder={(inv) => setReminderInvoice(inv)}
      />

      <ReminderModal
        invoice={reminderInvoice}
        isOpen={Boolean(reminderInvoice)}
        onClose={() => setReminderInvoice(null)}
      />

      <DuesAssistantModal
        isOpen={isDuesModalOpen}
        onClose={() => setIsDuesModalOpen(false)}
        invoices={invoices}
        onSelectInvoice={(inv) => setSelectedInvoice(inv)}
      />

      <PayPalSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={paypalConfig}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
