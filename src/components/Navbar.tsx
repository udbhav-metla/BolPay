import React from "react";
import { Mic, Settings, Moon, Sun } from "lucide-react";

interface NavbarProps {
  activeTab: "invoices" | "assistant" | "voice";
  onTabChange: (tab: "invoices" | "assistant" | "voice") => void;
  onOpenVoiceModal: () => void;
  onOpenSettings: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  isLiveSandbox: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenVoiceModal,
  onOpenSettings,
  isDarkMode,
  onToggleTheme,
  isLiveSandbox,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single Brand Wordmark */}
        <a
          href="/"
          className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <span className="text-[#003087] dark:text-sky-400">Bol</span>Pay
        </a>

        {/* Zone 2: Navigation Links (Single-line, unboxed, hover underline) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => onTabChange("invoices")}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-white ${
              activeTab === "invoices"
                ? "text-[#003087] dark:text-sky-400 font-bold"
                : ""
            }`}
          >
            Invoices & Dues
          </button>
          <button
            type="button"
            onClick={() => onTabChange("assistant")}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-white ${
              activeTab === "assistant"
                ? "text-[#003087] dark:text-sky-400 font-bold"
                : ""
            }`}
          >
            "Who Owes Me?"
          </button>
          <button
            type="button"
            onClick={() => onTabChange("voice")}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-white ${
              activeTab === "voice"
                ? "text-[#003087] dark:text-sky-400 font-bold"
                : ""
            }`}
          >
            Multilingual Audio Voice
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
          >
            PayPal Sandbox
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveSandbox ? "bg-emerald-500" : "bg-sky-500"
              }`}
            />
          </button>
        </nav>

        {/* Zone 3: Primary Action + Theme Toggle */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenVoiceModal}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#003087] hover:bg-[#002466] text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-[#003087]/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
          >
            <Mic className="w-4 h-4 text-sky-200" />
            <span>Speak Invoice</span>
          </button>
        </div>
      </div>
    </header>
  );
};
